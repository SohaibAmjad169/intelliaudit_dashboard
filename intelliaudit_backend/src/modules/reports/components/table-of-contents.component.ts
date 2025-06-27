import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';

export interface TableOfContentsSection {
  id: string;
  title: string;
  subsections?: TableOfContentsSubsection[];
}

export interface TableOfContentsSubsection {
  id: string;
  title: string;
  pageNumber?: number;
}

@Injectable()
export class TableOfContentsComponent extends BaseReportComponent {
  render(doc: typeof PDFDocument, _sections: TableOfContentsSection[]): void {
    this.resetPageLayout(doc);

    const brandGreen = '#4d9b58';
    const fontSize = 10;
    const leftMargin = doc.page.margins.left; // Get left margin

    // Title - explicitly positioned at left margin
    doc.fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(brandGreen)
      .text('Table of Contents', leftMargin, doc.y);

    doc.moveDown(1.5);

    const fullWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageMargin = 80;

    const checkForPageBreak = () => {
      if (doc.y > doc.page.height - doc.page.margins.bottom - pageMargin) {
        doc.addPage();
        this.resetPageLayout(doc);
      }
    };

    const addTitleWithDots = (
      title: string,
      pageNumber: string = '',
      isMainSection: boolean = false,
      indent: number = 0
    ) => {
      checkForPageBreak();
    
      if (isMainSection) {
        // Main section – no dots, no page number
        doc.fontSize(fontSize).font('Helvetica-Bold').fillColor(brandGreen);
        doc.text(title, doc.page.margins.left + indent, doc.y);
      } else {
        // Subsection – add dots and page number
        doc.fontSize(fontSize).font('Helvetica').fillColor('#000000');
        const textWidth = doc.widthOfString(title + ' ');
        const pageNumWidth = doc.widthOfString(pageNumber);
        const dotWidth = doc.widthOfString('.');
        const spaceForDots = fullWidth - indent - textWidth - pageNumWidth;
        const numDots = Math.floor(spaceForDots / dotWidth);
        const dots = '.'.repeat(Math.max(0, numDots));
        const line = `${title}${dots}${pageNumber}`;
        doc.text(line, doc.page.margins.left + indent, doc.y);
      }
    
      doc.moveDown(0.5);
    };
    

    const sections = [
      {
        title: 'I. Executive Summary',
        isMain: true,
        subsections: [
          'A. Introduction',
          'B. Summary Tables',
          'C. EEMs Performance Analysis Summary',
          'D. WEM Financial Analysis Summary',
          'E. Next Steps'
        ]
      },
      {
        title: 'II. ASHRAE Level II Energy Audit Report',
        isMain: true,
        subsections: [
          'A. Introduction',
          'B. Energy Audit Procedures',
          'C. EEMs Cost Savings Summary Table',
          'D. Existing Conditions and Observations',
          'E. Energy Efficiency Measures Recommended',
          'F. EEMs Already Implemented',
          'G. EEMs to Consider',
          'H. EEMs Requiring Further Investigation',
          'I. Current ENERGY STAR® Benchmarking Test',
          'J. Energy Use Analysis'
        ]
      },
      {
        title: 'III. Water Audit Report',
        isMain: true,
        subsections: [
          'A. Introduction',
          'B. Water Audit Procedures',
          'C. WEMs Cost Savings Summary Table',
          'D. Existing Conditions and Observations',
          'E. Water Efficiency Measures Recommended',
          'F. WEMs Already Implemented',
          'G. WEMs to Consider',
          'H. WEMs Requiring Further Investigation',
          'I. Water Use Analysis'
        ]
      },
      {
        title: 'IV. Retro-commissioning Report',
        isMain: true,
        subsections: [
          'A. Introduction',
          'B. Retro-commissioning Procedures',
          'C. RCMs Cost Savings Summary Table',
          'D. Existing Conditions and Observations',
          'E. Retro-commissioning Measures Recommended',
          'F. RCMs Already Implemented',
          'G. RCMs to Consider',
          'H. RCMs Requiring Further Investigation'
        ]
      },
      {
        title: 'V. Appendices',
        isMain: true,
        subsections: [
          'A. Glossary of Terms',
          'B. ASHRAE Level II Energy Audit Report Appendices',
          'C. Water Audit Report Appendices',
          'D. Retro-commissioning Report Appendices',
          'E. Utility Bill Analysis'
        ]
      }
    ];

    // Render sections and subsections
    let pageCounter = 3; // starting fake page number for demo

    sections.forEach(section => {
      addTitleWithDots(section.title, '', true, 0);

      section.subsections.forEach(sub => {
        addTitleWithDots(sub, `${pageCounter++}`, false, 20);
      });

      doc.moveDown(0.5);
    });

    // Add page after TOC
    doc.addPage();
  }
}
