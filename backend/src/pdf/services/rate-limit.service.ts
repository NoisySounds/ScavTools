import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RateLimitViolation {
	userId?: string;
	ipAddress: string;
	userAgent?: string;
	endpoint: string;
	timestamp: Date;
	requestCount: number;
	windowStart: Date;
}

export interface RateLimitResult {
	allowed: boolean;
	remainingRequests: number;
	resetTime: Date;
	totalHits: number;
}

@Injectable()
export class RateLimitService {
	private readonly logger = new Logger(RateLimitService.name);
	private readonly windowMs: number;
	private readonly maxRequests: number;
	private readonly trackByUser: boolean;

	// In-memory store for rate limiting (use Redis in production)
	private readonly requestStore: Map<
		string,
		{ count: number; resetTime: Date }
	> = new Map();

	constructor(
		private readonly configService: ConfigService,
		private readonly prisma: PrismaService
	) {
		this.windowMs = this.configService.get<number>(
			'PDF_RATE_LIMIT_WINDOW_MS',
			60000
		); // 1 minute
		this.maxRequests = this.configService.get<number>(
			'PDF_RATE_LIMIT_MAX_REQUESTS',
			20
		);
		this.trackByUser = this.configService.get<boolean>(
			'PDF_RATE_LIMIT_TRACK_BY_USER',
			true
		);
	}

	/**
	 * Check if request should be rate limited
	 */
	async checkRateLimit(
		userId?: string,
		ipAddress?: string,
		userAgent?: string
	): Promise<RateLimitResult> {
		const key = this.generateKey(userId, ipAddress);
		const now = new Date();

		let record = this.requestStore.get(key);

		// Initialize or reset if window expired
		if (!record || now >= record.resetTime) {
			record = {
				count: 0,
				resetTime: new Date(now.getTime() + this.windowMs),
			};
		}

		record.count++;
		this.requestStore.set(key, record);

		const allowed = record.count <= this.maxRequests;
		const remainingRequests = Math.max(0, this.maxRequests - record.count);

		// Log violation if limit exceeded
		if (!allowed) {
			await this.logViolation({
				userId,
				ipAddress: ipAddress || 'unknown',
				userAgent,
				endpoint: '/pdf/generate',
				timestamp: now,
				requestCount: record.count,
				windowStart: new Date(record.resetTime.getTime() - this.windowMs),
			});
		}

		return {
			allowed,
			remainingRequests,
			resetTime: record.resetTime,
			totalHits: record.count,
		};
	}

	/**
	 * Log rate limit violation
	 */
	private async logViolation(violation: RateLimitViolation): Promise<void> {
		try {
			await this.prisma.rateLimitViolation.create({
				data: {
					userId: violation.userId,
					ipAddress: violation.ipAddress,
					userAgent: violation.userAgent,
					endpoint: violation.endpoint,
					requestCount: violation.requestCount,
					windowStart: violation.windowStart,
					violatedAt: violation.timestamp,
				},
			});

			this.logger.warn(
				`Rate limit violation - ${violation.userId ? `User: ${violation.userId}` : `IP: ${violation.ipAddress}`}, ` +
					`Requests: ${violation.requestCount}/${this.maxRequests} in ${this.windowMs}ms window`
			);
		} catch (error) {
			this.logger.error('Failed to log rate limit violation', error.stack);
		}
	}

	/**
	 * Generate cache key for rate limiting
	 */
	private generateKey(userId?: string, ipAddress?: string): string {
		if (this.trackByUser && userId) {
			return `user:${userId}`;
		}
		return `ip:${ipAddress || 'unknown'}`;
	}

	/**
	 * Get rate limit statistics
	 */
	async getRateLimitStats(days: number = 7): Promise<{
		totalViolations: number;
		violationsByUser: Array<{
			userId: string;
			count: number;
			user: { firstName: string; lastName: string; email: string };
		}>;
		violationsByIp: Array<{ ipAddress: string; count: number }>;
		recentViolations: Array<{
			id: string;
			userId?: string;
			ipAddress: string;
			violatedAt: Date;
			requestCount: number;
		}>;
	}> {
		const since = new Date();
		since.setDate(since.getDate() - days);

		const violations = await this.prisma.rateLimitViolation.findMany({
			where: { violatedAt: { gte: since } },
			include: {
				user: { select: { firstName: true, lastName: true, email: true } },
			},
			orderBy: { violatedAt: 'desc' },
		});

		const totalViolations = violations.length;

		// Group by user
		const userViolations = violations
			.filter((v) => v.userId)
			.reduce(
				(acc, violation) => {
					const key = violation.userId!;
					if (!acc[key]) {
						acc[key] = { userId: key, count: 0, user: violation.user };
					}
					acc[key].count++;
					return acc;
				},
				{} as Record<string, any>
			);

		const violationsByUser = Object.values(userViolations)
			.sort((a: any, b: any) => b.count - a.count)
			.slice(0, 10);

		// Group by IP
		const ipViolations = violations.reduce(
			(acc, violation) => {
				const key = violation.ipAddress;
				acc[key] = (acc[key] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const violationsByIp = Object.entries(ipViolations)
			.map(([ipAddress, count]) => ({ ipAddress, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const recentViolations = violations.slice(0, 20).map((v) => ({
			id: v.id,
			userId: v.userId,
			ipAddress: v.ipAddress,
			violatedAt: v.violatedAt,
			requestCount: v.requestCount,
		}));

		return {
			totalViolations,
			violationsByUser,
			violationsByIp,
			recentViolations,
		};
	}

	/**
	 * Clean up expired entries (call this periodically)
	 */
	cleanupExpiredEntries(): void {
		const now = new Date();
		for (const [key, record] of this.requestStore.entries()) {
			if (now >= record.resetTime) {
				this.requestStore.delete(key);
			}
		}
	}
}
