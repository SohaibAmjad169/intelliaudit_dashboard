import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { BaseReportComponent } from './base-report.component';

@Injectable()
export class NextStepsComponent extends BaseReportComponent {
  constructor() {
    super();
    this.sections = ['Next Steps'];
  }

  /**
   * Renders the next steps section
   * @param doc PDFKit document
   * @param _data Unused data parameter
   */
  render(doc: typeof PDFDocument, _data: any): void {
    // Reset layout
    this.resetPageLayout(doc);
    
    // Brand colors
    const brandGreen = '#4d9b58';
    
    // Section title
    doc.fontSize(18)
       .fillColor(brandGreen)
       .font('Helvetica-Bold')
       .text('VIII. Next Steps', { align: 'left' });
    doc.moveDown();
    
    // Next steps content
    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica')
       .text('Based on the findings of this audit, the following next steps are recommended:');
    doc.moveDown();
    
    const nextSteps = [
      'Review and prioritize the recommended measures',
      'Develop an implementation plan',
      'Secure necessary approvals and funding',
      'Schedule implementation of high-priority measures',
      'Monitor and verify energy savings',
      'Consider additional energy efficiency opportunities'
    ];
    
    nextSteps.forEach(step => {
      doc.fontSize(10)
         .text(`• ${step}`);
    });
    
    // Add a page break after the section
    doc.addPage();
  }
} 