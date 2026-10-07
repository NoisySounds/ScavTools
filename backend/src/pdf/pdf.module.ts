import { Module } from '@nestjs/common';
import { MarkdownToPdfService } from './services/markdown-to-pdf.service';
import { PdfController } from './controllers/pdf.controller';
import { PdfService } from './services/pdf.service';
import { HtmlToPdfService } from './services/html-to-pdf.service';
import { PdfLogService } from './services/pdf-log.service';
import { AuthModule } from './../userAuth/auth.module';
import { PrismaModule } from './../../prisma/prisma.module';

@Module({
	imports: [AuthModule, PrismaModule],
	controllers: [PdfController],
	providers: [
		PdfService,
		HtmlToPdfService,
		MarkdownToPdfService,
		PdfLogService,
	],
	exports: [PdfService, PdfLogService],
})
export class PdfModule {}
