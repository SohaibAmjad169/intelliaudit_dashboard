import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';

@Injectable()
export class MeasuresFinancialAnalysisComponent extends BaseReportComponent {
  /**
   * Renders the financial analysis section of the report
   * @param doc PDFKit document
   * @param data Object containing financial analysis data
   */
  render(doc: typeof PDFDocument, data: any): void {
    const { measures } = data;
    
    // Reset layout
    this.resetPageLayout(doc);
    
    // Brand colors
    const brandGreen = '#4d9b58';
    const sectionGrey = '#4A4A4A';
    
    // Section title (Roman numeral)
    doc.fontSize(18)
       .fillColor(brandGreen)
       .font('Helvetica-Bold')
       .text('III.   Financial Analysis', { align: 'left' });
    doc.moveDown();
    
    // Helper function to render table rows
    const renderTableRow = (y: number, cells: string[], columnWidths: number[]) => {
      let x = doc.page.margins.left;
      cells.forEach((cell, i) => {
        doc.text(cell, x, y, { width: columnWidths[i] });
        x += columnWidths[i];
      });
    };
    
    // Table header
    const headerY = doc.y;
    const columnWidths = [150, 100, 100, 100, 100];
    const headerCells = ['Measure', 'Total Cost', 'Annual Savings', 'ROI', 'Payback'];
    
    // Draw header background
    doc.rect(doc.page.margins.left, headerY, 
             columnWidths.reduce((a, b) => a + b, 0), 20)
       .fill('#f5f5f5');
    
    // Header text
    doc.fontSize(10)
       .fillColor(sectionGrey)
       .font('Helvetica-Bold');
    renderTableRow(headerY + 5, headerCells, columnWidths);
    
    // Table content
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica');
    
    let currentY = headerY + 25;
    measures.forEach((measure: any) => {
      if (currentY > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      
      const cells = [
        measure.title || '',
        this.formatCurrency(measure.totalCost || 0),
        this.formatCurrency(measure.annualSavings || 0),
        `${(measure.roi || 0).toFixed(1)}%`,
        `${measure.paybackPeriod || 0} years`
      ];
      
      renderTableRow(currentY, cells, columnWidths);
      currentY += 20;
    });
    
    // Add summary section
    doc.moveDown(2);
    doc.fontSize(14)
       .fillColor(sectionGrey)
       .font('Helvetica-Bold')
       .text('A. Summary of Financial Benefits:', { align: 'left' });
    doc.moveDown();
    
    // Calculate totals
    const totalCost = measures.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
    const totalSavings = measures.reduce((sum: number, m: any) => sum + (m.annualSavings || 0), 0);
    const avgROI = measures.reduce((sum: number, m: any) => sum + (m.roi || 0), 0) / measures.length;
    const avgPayback = measures.reduce((sum: number, m: any) => sum + (m.paybackPeriod || 0), 0) / measures.length;
    
    // Summary text
    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica');
    
    doc.text(`Total Implementation Cost: ${this.formatCurrency(totalCost)}`);
    doc.moveDown(0.5);
    doc.text(`Total Annual Savings: ${this.formatCurrency(totalSavings)}`);
    doc.moveDown(0.5);
    doc.text(`Average ROI: ${avgROI.toFixed(1)}%`);
    doc.moveDown(0.5);
    doc.text(`Average Payback Period: ${avgPayback.toFixed(1)} years`);
    
    // Add a page break after the section
    doc.addPage();
  }
} 