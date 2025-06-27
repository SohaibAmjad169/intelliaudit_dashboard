import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';

@Injectable()
export class MeasuresSummaryTableComponent extends BaseReportComponent {
  /**
   * Renders the measures summary table section of the report
   * @param doc PDFKit document
   * @param data Object containing measures data
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
       .text('II.   Measures Summary', { align: 'left' });
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
    const columnWidths = [100, 200, 100, 100, 100];
    const headerCells = ['Measure', 'Description', 'Cost', 'Savings', 'Payback'];
    
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
        measure.description || '',
        this.formatCurrency(measure.cost || 0),
        this.formatCurrency(measure.savings || 0),
        `${measure.paybackPeriod || 0} years`
      ];
      
      renderTableRow(currentY, cells, columnWidths);
      currentY += 20;
    });
    
    // Add a page break after the table
    doc.addPage();
  }
} 