import {
	Controller,
	Post,
	Body,
	Res,
	HttpStatus,
	Logger,
	ValidationPipe,
	UsePipes,
	UseGuards,
	Req,
	Get,
	Query,
} from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { GeneratePdfDto } from '../dto/generate-pdf.dto';
import {
	AuthenticatedRequest,
	JwtAuthGuard,
} from 'src/userAuth/guards/jwt-auth.guard';
import { PdfLogService } from '../services/pdf-log.service';
import { PdfInputType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Controller('pdf')
export class PdfController {
	private readonly logger = new Logger(PdfController.name);

	constructor(
		private readonly pdfService: PdfService,
		private readonly pdfLogService: PdfLogService
	) {}

	@Post('generate')
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async generatePdf(
		@Body() generatePdfDto: GeneratePdfDto,
		@Res() res: Response,
		@Req() req: AuthenticatedRequest
	) {
		const requestId = uuidv4();
		const startTime = Date.now();
		const userId = req.user.userId;

		// Extract request metadata
		const userAgent = req.headers['user-agent'];
		const ipAddress =
			req.ip ||
			req.connection.remoteAddress ||
			(req.headers['x-forwarded-for'] as string);

		let inputType: PdfInputType;
		let inputContent: string;
		let inputSize: number;

		try {
			// Validate that exactly one field is provided
			generatePdfDto.validate();

			// Determine input type and content
			if (generatePdfDto.html) {
				inputType = PdfInputType.HTML;
				inputContent = generatePdfDto.html;
			} else {
				inputType = PdfInputType.MARKDOWN;
				inputContent = generatePdfDto.markdown!;
			}

			inputSize = Buffer.byteLength(inputContent, 'utf8');

			const inputSnippet = this.createSafeInputSnippet(inputContent);

			this.logger.log(
				`[${requestId}] Starting PDF generation - User: ${userId}, Type: ${inputType}, Size: ${inputSize} bytes`
			);

			let result;

			if (generatePdfDto.html) {
				this.logger.log(`[${requestId}] Generating PDF from HTML`);
				result = await this.pdfService.generateFromHtml(generatePdfDto.html);
			} else if (generatePdfDto.markdown) {
				this.logger.log(`[${requestId}] Generating PDF from Markdown`);
				result = await this.pdfService.generateFromMarkdown(
					generatePdfDto.markdown
				);
			}

			const processingTime = Date.now() - startTime;

			this.logger.log(
				`[${requestId}] PDF generated successfully - Size: ${result!.metadata.size} bytes, ` +
					`Pages: ${result!.metadata.pages}, Time: ${processingTime}ms`
			);

			await this.pdfLogService.logPdfGeneration({
				userId,
				inputType,
				inputSize,
				processingTime,
				success: true,
				inputSnippet,
				outputSize: result!.metadata.size,
				pageCount: result!.metadata.pages,
				userAgent,
				ipAddress,
				requestId,
			});

			res.set({
				'Content-Type': 'application/pdf',
				'Content-Length': result!.metadata.size.toString(),
				'Content-Disposition': 'inline; filename="document.pdf"',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'X-PDF-Pages': result!.metadata.pages.toString(),
				'X-Generation-Time': result!.metadata.generationTime.toString(),
				'X-Request-ID': requestId,
			});

			res.status(HttpStatus.OK).send(result!.buffer);
		} catch (error) {
			const processingTime = Date.now() - startTime;

			this.logger.error(
				`[${requestId}] PDF generation failed after ${processingTime}ms`,
				error.stack
			);

			await this.pdfLogService.logPdfGeneration({
				userId,
				inputType: inputType!,
				inputSize: inputSize || 0,
				processingTime,
				success: false,
				errorMessage: error.message,
				errorStack: error.stack,
				inputSnippet: inputSize
					? this.createSafeInputSnippet(inputContent!)
					: undefined,
				userAgent,
				ipAddress,
				requestId,
			});

			if (
				error.message.includes('required') ||
				error.message.includes('Provide either')
			) {
				res.status(HttpStatus.BAD_REQUEST).json({
					error: 'Validation failed',
					message: error.message,
					statusCode: HttpStatus.BAD_REQUEST,
					requestId,
				});
			} else if (
				error.message.includes('parsing') ||
				error.message.includes('sanitization')
			) {
				res.status(HttpStatus.BAD_REQUEST).json({
					error: 'Input processing failed',
					message: error.message,
					statusCode: HttpStatus.BAD_REQUEST,
					requestId,
				});
			} else {
				res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
					error: 'PDF generation failed',
					message: 'An internal server error occurred during PDF generation',
					statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
					requestId,
				});
			}
		}
	}

	@Get('analytics')
	@UseGuards(JwtAuthGuard)
	async getUserAnalytics(
		@Req() req: AuthenticatedRequest,
		@Query('days') days?: string
	) {
		const userId = req.user.id;
		const daysParsed = days ? parseInt(days, 10) : 30;

		if (daysParsed < 1 || daysParsed > 365) {
			return {
				error: 'Days parameter must be between 1 and 365',
				statusCode: HttpStatus.BAD_REQUEST,
			};
		}

		try {
			const analytics = await this.pdfLogService.getUserAnalytics(
				userId,
				daysParsed
			);
			return {
				data: analytics,
				period: `${daysParsed} days`,
				statusCode: HttpStatus.OK,
			};
		} catch (error) {
			this.logger.error('Failed to fetch user analytics', error.stack);
			return {
				error: 'Failed to fetch analytics',
				message: 'An error occurred while retrieving analytics data',
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			};
		}
	}

	@Get('analytics/system')
	@UseGuards(JwtAuthGuard)
	async getSystemAnalytics(
		@Req() req: AuthenticatedRequest,
		@Query('days') days?: string
	) {
		const daysParsed = days ? parseInt(days, 10) : 30;

		if (daysParsed < 1 || daysParsed > 365) {
			return {
				error: 'Days parameter must be between 1 and 365',
				statusCode: HttpStatus.BAD_REQUEST,
			};
		}

		try {
			const analytics = await this.pdfLogService.getSystemAnalytics(daysParsed);
			return {
				data: analytics,
				period: `${daysParsed} days`,
				statusCode: HttpStatus.OK,
			};
		} catch (error) {
			this.logger.error('Failed to fetch system analytics', error.stack);
			return {
				error: 'Failed to fetch system analytics',
				message: 'An error occurred while retrieving system analytics data',
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			};
		}
	}

	@Get('analytics/errors')
	@UseGuards(JwtAuthGuard)
	async getErrorPatterns(@Query('days') days?: string) {
		const daysParsed = days ? parseInt(days, 10) : 7;

		if (daysParsed < 1 || daysParsed > 30) {
			return {
				error: 'Days parameter must be between 1 and 30',
				statusCode: HttpStatus.BAD_REQUEST,
			};
		}

		try {
			const errorPatterns =
				await this.pdfLogService.getErrorPatterns(daysParsed);
			return {
				data: errorPatterns,
				period: `${daysParsed} days`,
				statusCode: HttpStatus.OK,
			};
		} catch (error) {
			this.logger.error('Failed to fetch error patterns', error.stack);
			return {
				error: 'Failed to fetch error patterns',
				message: 'An error occurred while retrieving error pattern data',
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			};
		}
	}

	/**
	 * Safe snippet of input content for logging
	 * Removes potential sensitive information and limits length
	 */
	private createSafeInputSnippet(content: string): string {
		let safe = content
			.replace(
				/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
				'[EMAIL]'
			)
			.replace(/https?:\/\/[^\s]+/g, '[URL]')
			.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
			.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

		return safe.length > 500 ? safe.substring(0, 500) + '...' : safe;
	}
}
