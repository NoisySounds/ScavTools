import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarkdownToPdfService } from './services/markdown-to-pdf.service';
import { PdfController } from './controllers/pdf.controller';
import { PdfService } from './services/pdf.service';
import { HtmlToPdfService } from './services/html-to-pdf.service';
import { PdfLogService } from './services/pdf-log.service';
import { RateLimitService } from './services/rate-limit.service';
import { PdfRateLimitGuard } from './guards/rate-limit.guard';
import { AuthModule } from './../userAuth/auth.module';
import { PrismaModule } from './../../prisma/prisma.module';

@Module({
	imports: [AuthModule, PrismaModule, ConfigModule],
	controllers: [PdfController],
	providers: [
		PdfService,
		HtmlToPdfService,
		MarkdownToPdfService,
		PdfLogService,
		RateLimitService,
		PdfRateLimitGuard,
	],
	exports: [PdfService, PdfLogService, RateLimitService],
})
export class PdfModule {}
