import {
	Injectable,
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import { AuthenticatedRequest } from '../../userAuth/guards/jwt-auth.guard';

@Injectable()
export class PdfRateLimitGuard implements CanActivate {
	private readonly logger = new Logger(PdfRateLimitGuard.name);

	constructor(private readonly rateLimitService: RateLimitService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const response = context.switchToHttp().getResponse<Response>();

		// Extract user info and IP
		const userId = request.user?.userId;
		const ipAddress = this.getClientIp(request);
		const userAgent = request.headers['user-agent'];

		try {
			const result = await this.rateLimitService.checkRateLimit(
				userId,
				ipAddress,
				userAgent
			);

			// Set rate limit headers
			response.set({
				'X-RateLimit-Limit': '20',
				'X-RateLimit-Remaining': result.remainingRequests.toString(),
				'X-RateLimit-Reset': result.resetTime.toISOString(),
				'X-RateLimit-Used': result.totalHits.toString(),
			});

			if (!result.allowed) {
				this.logger.warn(
					`Rate limit exceeded for ${userId ? `user ${userId}` : `IP ${ipAddress}`}`
				);

				throw new HttpException(
					{
						error: 'Too Many Requests',
						message:
							'PDF generation rate limit exceeded. Please wait before making another request.',
						statusCode: HttpStatus.TOO_MANY_REQUESTS,
						rateLimitInfo: {
							limit: 20,
							remaining: result.remainingRequests,
							resetTime: result.resetTime.toISOString(),
							retryAfter: Math.ceil(
								(result.resetTime.getTime() - Date.now()) / 1000
							),
						},
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			return true;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			this.logger.error('Rate limit check failed', error.stack);
			// Allow request to proceed if rate limiting fails
			return true;
		}
	}

	private getClientIp(request: Request): string {
		return (
			(request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
			(request.headers['x-real-ip'] as string) ||
			request.connection?.remoteAddress ||
			request.socket?.remoteAddress ||
			'unknown'
		);
	}
}
