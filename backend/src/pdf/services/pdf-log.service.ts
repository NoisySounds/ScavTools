import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfInputType } from '@prisma/client';

export interface PdfLogData {
	userId: string;
	inputType: PdfInputType;
	inputSize: number;
	processingTime: number;
	success: boolean;
	errorMessage?: string;
	errorStack?: string;
	inputSnippet?: string;
	outputSize?: number;
	pageCount?: number;
	userAgent?: string;
	ipAddress?: string;
	requestId?: string;
}

export interface PdfLogAnalytics {
	totalRequests: number;
	successRate: number;
	averageProcessingTime: number;
	averageInputSize: number;
	averageOutputSize: number;
	mostCommonInputType: PdfInputType;
	recentFailures: Array<{
		id: string;
		createdAt: Date;
		errorMessage: string;
		inputType: PdfInputType;
	}>;
}

@Injectable()
export class PdfLogService {
	private readonly logger = new Logger(PdfLogService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Log a PDF generation request
	 */
	async logPdfGeneration(data: PdfLogData): Promise<void> {
		try {
			await this.prisma.pdfGenerationLog.create({
				data: {
					userId: data.userId,
					inputType: data.inputType,
					inputSize: data.inputSize,
					processingTime: data.processingTime,
					success: data.success,
					errorMessage: data.errorMessage,
					errorStack: data.errorStack,
					inputSnippet: data.inputSnippet,
					outputSize: data.outputSize,
					pageCount: data.pageCount,
					userAgent: data.userAgent,
					ipAddress: data.ipAddress,
					requestId: data.requestId,
				},
			});

			this.logger.log(
				`PDF generation logged: ${data.success ? 'SUCCESS' : 'FAILURE'} - User: ${data.userId}, Type: ${data.inputType}, Time: ${data.processingTime}ms`
			);
		} catch (error) {
			this.logger.error('Failed to log PDF generation', error.stack);
			// Don't throw here to avoid disrupting the main PDF generation flow
		}
	}

	/**
	 * Get PDF generation analytics for a user
	 */
	async getUserAnalytics(
		userId: string,
		days: number = 30
	): Promise<PdfLogAnalytics> {
		const since = new Date();
		since.setDate(since.getDate() - days);

		const logs = await this.prisma.pdfGenerationLog.findMany({
			where: {
				userId,
				createdAt: { gte: since },
			},
			orderBy: { createdAt: 'desc' },
		});

		const totalRequests = logs.length;
		const successfulRequests = logs.filter((log) => log.success).length;
		const successRate =
			totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

		const averageProcessingTime =
			totalRequests > 0
				? logs.reduce((sum, log) => sum + log.processingTime, 0) / totalRequests
				: 0;

		const averageInputSize =
			totalRequests > 0
				? logs.reduce((sum, log) => sum + log.inputSize, 0) / totalRequests
				: 0;

		const successfulLogs = logs.filter((log) => log.success && log.outputSize);
		const averageOutputSize =
			successfulLogs.length > 0
				? successfulLogs.reduce((sum, log) => sum + (log.outputSize || 0), 0) /
					successfulLogs.length
				: 0;

		const inputTypeCounts = logs.reduce(
			(acc, log) => {
				acc[log.inputType] = (acc[log.inputType] || 0) + 1;
				return acc;
			},
			{} as Record<PdfInputType, number>
		);

		const mostCommonInputType =
			(Object.entries(inputTypeCounts).sort(
				([, a], [, b]) => b - a
			)[0]?.[0] as PdfInputType) || PdfInputType.HTML;

		const recentFailures = logs
			.filter((log) => !log.success)
			.slice(0, 10)
			.map((log) => ({
				id: log.id,
				createdAt: log.createdAt,
				errorMessage: log.errorMessage || 'Unknown error',
				inputType: log.inputType,
			}));

		return {
			totalRequests,
			successRate,
			averageProcessingTime,
			averageInputSize,
			averageOutputSize,
			mostCommonInputType,
			recentFailures,
		};
	}

	/**
	 * Get system-wide analytics (admin only)
	 */
	async getSystemAnalytics(days: number = 30): Promise<
		PdfLogAnalytics & {
			topUsers: Array<{
				userId: string;
				requestCount: number;
				user: { firstName: string; lastName: string; email: string };
			}>;
		}
	> {
		const since = new Date();
		since.setDate(since.getDate() - days);

		const logs = await this.prisma.pdfGenerationLog.findMany({
			where: { createdAt: { gte: since } },
			include: {
				user: { select: { firstName: true, lastName: true, email: true } },
			},
			orderBy: { createdAt: 'desc' },
		});

		// Base analytics
		const baseAnalytics = await this.calculateBaseAnalytics(logs);

		// Top users
		const userCounts = logs.reduce(
			(acc, log) => {
				const key = log.userId;
				if (!acc[key]) {
					acc[key] = { userId: log.userId, requestCount: 0, user: log.user };
				}
				acc[key].requestCount++;
				return acc;
			},
			{} as Record<string, { userId: string; requestCount: number; user: any }>
		);

		const topUsers = Object.values(userCounts)
			.sort((a, b) => b.requestCount - a.requestCount)
			.slice(0, 10);

		return { ...baseAnalytics, topUsers };
	}

	/**
	 * Get error patterns for debugging
	 */
	async getErrorPatterns(days: number = 7): Promise<
		Array<{
			errorMessage: string;
			count: number;
			lastOccurrence: Date;
			inputTypes: PdfInputType[];
		}>
	> {
		const since = new Date();
		since.setDate(since.getDate() - days);

		const errorLogs = await this.prisma.pdfGenerationLog.findMany({
			where: {
				success: false,
				createdAt: { gte: since },
				errorMessage: { not: null },
			},
			select: {
				errorMessage: true,
				inputType: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		const errorPatterns = errorLogs.reduce(
			(acc, log) => {
				const key = log.errorMessage!;
				if (!acc[key]) {
					acc[key] = {
						errorMessage: key,
						count: 0,
						lastOccurrence: log.createdAt,
						inputTypes: new Set<PdfInputType>(),
					};
				}
				acc[key].count++;
				acc[key].inputTypes.add(log.inputType);
				if (log.createdAt > acc[key].lastOccurrence) {
					acc[key].lastOccurrence = log.createdAt;
				}
				return acc;
			},
			{} as Record<string, any>
		);

		return Object.values(errorPatterns)
			.map((pattern) => ({
				...pattern,
				inputTypes: Array.from(pattern.inputTypes),
			}))
			.sort((a, b) => b.count - a.count);
	}

	private async calculateBaseAnalytics(logs: any[]): Promise<PdfLogAnalytics> {
		const totalRequests = logs.length;
		const successfulRequests = logs.filter((log) => log.success).length;
		const successRate =
			totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

		const averageProcessingTime =
			totalRequests > 0
				? logs.reduce((sum, log) => sum + log.processingTime, 0) / totalRequests
				: 0;

		const averageInputSize =
			totalRequests > 0
				? logs.reduce((sum, log) => sum + log.inputSize, 0) / totalRequests
				: 0;

		const successfulLogs = logs.filter((log) => log.success && log.outputSize);
		const averageOutputSize =
			successfulLogs.length > 0
				? successfulLogs.reduce((sum, log) => sum + (log.outputSize || 0), 0) /
					successfulLogs.length
				: 0;

		const inputTypeCounts = logs.reduce(
			(acc, log) => {
				acc[log.inputType] = (acc[log.inputType] || 0) + 1;
				return acc;
			},
			{} as Record<PdfInputType, number>
		);

		const mostCommonInputType =
			(Object.entries(inputTypeCounts).sort(
				([, a], [, b]) => b - a
			)[0]?.[0] as PdfInputType) || PdfInputType.HTML;

		const recentFailures = logs
			.filter((log) => !log.success)
			.slice(0, 10)
			.map((log) => ({
				id: log.id,
				createdAt: log.createdAt,
				errorMessage: log.errorMessage || 'Unknown error',
				inputType: log.inputType,
			}));

		return {
			totalRequests,
			successRate,
			averageProcessingTime,
			averageInputSize,
			averageOutputSize,
			mostCommonInputType,
			recentFailures,
		};
	}
}
