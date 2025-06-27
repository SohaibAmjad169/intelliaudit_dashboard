import { Controller, Post, Get, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsPrismaService } from './reports-prisma.service';
import { ReportTemplateService } from './services/report-template.service';
import { Logger } from '@nestjs/common';


@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsPrismaService,
    private readonly reportTemplateService: ReportTemplateService
  ) {}

  @Get('energy-summary')
  @ApiOperation({
    summary: 'Get energy summary report data',
    description: 'Returns JSON data for the energy summary report for the specified project ID'
  })
  @ApiQuery({
    name: 'projectId',
    description: 'The ID of the project to generate a report for',
    type: String,
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Energy summary data returned successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found'
  })
  async getEnergySummary(
    @Query('projectId') projectId: string
  ) {
    try {
      const reportData = await this.reportsService.getEnergySummaryData(projectId);
      return reportData;
    } catch (error) {
      if (error.message === 'Project not found') {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Error generating energy summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('project/:projectId/pdf')
  @ApiOperation({
    summary: 'Generate PDF report for a project',
    description: 'Generates a PDF report for the specified project ID',
  })
  @ApiParam({
    name: 'projectId',
    description: 'The ID of the project to generate a report for',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'PDF report generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Error generating PDF report',
  })
  async generateProjectReportPdf(
    @Param('projectId') projectId: string,
    @Res() res: Response
  ) {
    try {

      // Generate the PDF report
      const pdfBuffer = await this.reportsService.generateProjectReportPdf(projectId);

      // Add cache-busting headers to prevent PDF caching
      const timestamp = Date.now();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=energy-audit-report-${projectId}-${timestamp}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error generating PDF report for project ${projectId}: ${error.message}`, error.stack);

      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errorMessage = `Error generating PDF report: ${error.message}`;

      if (error.message === 'Project not found') {
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Project not found';
      }
      // Use a clearer error message for utility data issues
      else if (error.message && error.message.includes('No utility calculations found')) {
        errorMessage = 'Error generating PDF report: Missing utility data for this project. Please add utility bill data for at least one month.';
      }

      throw new HttpException(errorMessage, statusCode);
    }
  }

  @Post('project/:projectId/html-pdf')
  @ApiOperation({
    summary: 'Generate HTML-based PDF report for a project',
    description: 'Generates a PDF report using HTML templates for the specified project ID',
  })
  @ApiParam({
    name: 'projectId',
    description: 'The ID of the project to generate a report for',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'HTML-based PDF report generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Error generating HTML-based PDF report',
  })
  async generateProjectReportHtmlPdf(
    @Param('projectId') projectId: string,
    @Res() res: Response
  ) {
    try {
      // Get the report data
      const reportData = await this.reportsService.getReportData(projectId);

      // Generate the HTML-based PDF report
      const pdfBuffer = await this.reportTemplateService.generateReport(projectId, reportData);

      // Add cache-busting headers to prevent PDF caching
      const timestamp = Date.now();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=energy-audit-report-${projectId}-${timestamp}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error generating HTML-based PDF report for project ${projectId}: ${error.message}`, error.stack);

      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errorMessage = `Error generating HTML-based PDF report: ${error.message}`;

      if (error.message === 'Project not found') {
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Project not found';
      }
      // Use a clearer error message for utility data issues
      else if (error.message && error.message.includes('No utility calculations found')) {
        errorMessage = 'Error generating HTML-based PDF report: Missing utility data for this project. Please add utility bill data for at least one month.';
      }

      throw new HttpException(errorMessage, statusCode);
    }
  }
}