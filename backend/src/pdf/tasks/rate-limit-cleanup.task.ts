import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitCleanupTask {
	private readonly logger = new Logger(RateLimitCleanupTask.name);

	constructor(private readonly rateLimitService: RateLimitService) {}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async cleanupExpiredEntries() {
		try {
			this.rateLimitService.cleanupExpiredEntries();
			this.logger.debug('Rate limit cleanup completed');
		} catch (error) {
			this.logger.error('Rate limit cleanup failed', error.stack);
		}
	}
}
