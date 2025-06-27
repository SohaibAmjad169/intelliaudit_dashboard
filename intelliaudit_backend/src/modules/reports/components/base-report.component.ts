import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

/**
 * Base class for all report components
 * Provides common utility methods for PDF generation
 */
@Injectable()
export abstract class BaseReportComponent {
  protected sections: string[] = [];

  /**
   * Renders the component to the PDF document
   * @param doc PDFKit document
   * @param data Data required for rendering
   */
  abstract render(doc: typeof PDFDocument, data: any): void;

  /**
   * Resets the page layout for consistent formatting
   * @param doc PDFKit document
   * @returns Full content width of the page
   */
  protected resetPageLayout(doc: typeof PDFDocument): number {
    doc.font('Helvetica');
    doc.fontSize(12);
    doc.fillColor('#000000');
    doc.text('', { align: 'left' });
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  /**
   * Adds a new page and resets the layout
   * @param doc PDFKit document
   * @returns Full content width of the page
   */
  protected addPageWithResetLayout(doc: typeof PDFDocument): number {
    doc.addPage();
    return this.resetPageLayout(doc);
  }

  /**
   * Formats a number with commas and optional decimal places
   * @param num Number to format
   * @param decimalPlaces Number of decimal places (default: 0)
   * @returns Formatted string
   */
  protected formatNumber(num: number | null | undefined, decimalPlaces: number = 0): string {
    // Handle null or undefined values
    if (num === null || num === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(num);
  }

  /**
   * Formats a currency value with 2 decimal places
   * @param amount Amount to format
   * @returns Formatted string
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Adds a simple table to the document
   * @param doc PDFKit document
   * @param headers Table headers
   * @param rows Table data rows
   * @param width Width of the table
   * @param options Additional table options
   */
  protected addSimpleTable(
    doc: typeof PDFDocument,
    headers: string[],
    rows: (string | number)[][],
    width: number,
    options: {
      headerBgColor?: string;
      headerTextColor?: string;
      zebra?: boolean;
      zebraColors?: { even: string; odd: string };
      columnWidths?: number[];
      columnAlignments?: ('left' | 'center' | 'right')[];
      borderColor?: string;
      headerHeight?: number;
      rowHeight?: number;
      fontSize?: { header?: number; body?: number };
    } = {}
  ): void {
    // Default options
    const headerBgColor = options.headerBgColor || '#e6f2e6';
    const headerTextColor = options.headerTextColor || '#4A4A4A';
    const zebra = options.zebra !== undefined ? options.zebra : true;
    const zebraColors = options.zebraColors || { even: '#FFFFFF', odd: '#f9f9f9' };
    const borderColor = options.borderColor || '#CCCCCC';
    const headerHeight = options.headerHeight || 35;
    const rowHeight = options.rowHeight || 30;
    const fontSize = options.fontSize || { header: 10, body: 10 };

    // Calculate column widths
    const columnWidths = options.columnWidths || headers.map(() => width / headers.length);
    const columnAlignments = options.columnAlignments || headers.map((_, i) => i === 0 ? 'left' : 'right');

    const tableTop = doc.y;
    const startX = doc.page.margins.left;

    // Draw header background
    doc.rect(startX, tableTop, width, headerHeight)
       .fill(headerBgColor)
       .stroke(borderColor);

    // Draw header text
    doc.fontSize(fontSize.header || 10)
       .fillColor(headerTextColor)
       .font('Helvetica-Bold');

    let x = startX;
    headers.forEach((header, i) => {
      // Calculate vertical center for better header alignment
      const textHeight = doc.heightOfString(header, { width: columnWidths[i] - 10 });
      const verticalCenter = tableTop + (headerHeight - textHeight) / 2;

      // Add padding based on alignment
      const padding = columnAlignments[i] === 'left' ? 5 : 0;
      const rightPadding = columnAlignments[i] === 'left' ? 0 : 5;

      doc.text(header, x + padding, verticalCenter, {
        width: columnWidths[i] - (padding + rightPadding),
        align: columnAlignments[i]
      });
      x += columnWidths[i];
    });

    // Reset for body
    doc.font('Helvetica');
    doc.fontSize(fontSize.body || 10);

    // Draw body rows
    let currentY = tableTop + headerHeight;
    rows.forEach((row, rowIndex) => {
      // Draw row background (zebra striping)
      if (zebra) {
        doc.rect(startX, currentY, width, rowHeight)
           .fill(rowIndex % 2 === 0 ? zebraColors.odd : zebraColors.even)
           .stroke(borderColor);
      } else {
        doc.rect(startX, currentY, width, rowHeight)
           .fill('#FFFFFF')
           .stroke(borderColor);
      }

      // Draw cell text
      x = startX;
      row.forEach((cell, i) => {
        const cellText = String(cell);

        // Calculate vertical center for better alignment
        const textHeight = doc.heightOfString(cellText, { width: columnWidths[i] - 10 });
        const verticalCenter = currentY + (rowHeight - textHeight) / 2;

        // Add padding based on alignment
        const padding = columnAlignments[i] === 'left' ? 5 : 0;
        const rightPadding = columnAlignments[i] === 'left' ? 0 : 5;

        doc.fillColor(cellText === 'N/A' ? '#666666' : '#000000')
           .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
           .text(cellText, x + padding, verticalCenter, {
              width: columnWidths[i] - (padding + rightPadding),
              align: columnAlignments[i]
           });
        x += columnWidths[i];
      });

      currentY += rowHeight;

      // Check for page break
      if (currentY > doc.page.height - doc.page.margins.bottom - rowHeight) {
        this.addPageWithResetLayout(doc);
        currentY = doc.y;

        // Redraw header on new page
        doc.rect(startX, currentY, width, headerHeight)
           .fill(headerBgColor)
           .stroke(borderColor);

        doc.fontSize(fontSize.header || 10)
           .fillColor(headerTextColor)
           .font('Helvetica-Bold');

        x = startX;
        headers.forEach((header, i) => {
          const textHeight = doc.heightOfString(header, { width: columnWidths[i] - 10 });
          const verticalCenter = currentY + (headerHeight - textHeight) / 2;

          const padding = columnAlignments[i] === 'left' ? 5 : 0;
          const rightPadding = columnAlignments[i] === 'left' ? 0 : 5;

          doc.text(header, x + padding, verticalCenter, {
            width: columnWidths[i] - (padding + rightPadding),
            align: columnAlignments[i]
          });
          x += columnWidths[i];
        });

        // Reset for body
        doc.font('Helvetica');
        doc.fontSize(fontSize.body || 10);

        currentY += headerHeight;
      }
    });

    doc.y = currentY + 10; // Set doc.y after the table with some padding
    doc.strokeOpacity(1).strokeColor('#000000'); // Reset stroke
  }

  /**
   * Checks if a section exists in the component
   * @param sectionName Name of the section to check
   * @returns Boolean indicating if the section exists
   */
  public hasSection(sectionName: string): boolean {
    return this.sections.includes(sectionName);
  }
}