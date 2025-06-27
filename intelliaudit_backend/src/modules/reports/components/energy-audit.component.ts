import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EnergyAuditComponent extends BaseReportComponent {
   constructor() {
      super();
      this.sections = [
         'Introduction',
         'Energy Audit Procedures',
         'Cost Savings Summary Table',
         'Existing Conditions',
         'Recommended Measures',
         'Implemented Measures',
         'Measures to Consider',
         'Measures Requiring Investigation',
         'ENERGY STAR Benchmarking',
         'Energy Use Analysis'
      ];
   }

   /**
    * Renders the energy audit section of the report
    * @param doc PDFKit document
    * @param data Object containing energy audit data
    */
   render(doc: typeof PDFDocument, data: any): void {
      const { endUseBreakdown, totalUsage, monthlyData, measures, existingConditions, energyStarData } = data;

      this.resetPageLayout(doc);

      const brandGreen = '#4d9b58';
      const sectionGrey = '#4A4A4A';

      doc.fontSize(18)
         .fillColor(brandGreen)
         .font('Helvetica-Bold')
         .text('II.   ASHRAE Level II Energy Audit Report', { align: 'left' });
      doc.moveDown(0.5);

      this.renderSectionHeader(doc, 'A. Introduction:', sectionGrey);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('This section provides a comprehensive analysis of the building\'s energy systems and identifies opportunities for energy efficiency improvements.');
      doc.moveDown(0.5);

      this.renderSectionHeader(doc, 'B. Energy Audit Procedures:', sectionGrey);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The energy audit was conducted following ASHRAE Level II procedures, including:');

      const procedures = [
         'Detailed analysis of utility bills and energy consumption patterns',
         'On-site inspection of building systems and equipment',
         'Measurement and verification of system performance',
         'Identification of energy efficiency opportunities',
         'Cost-benefit analysis of recommended measures'
      ];

      procedures.forEach(procedure => {
         doc.fontSize(10).text(`• ${procedure}`);
      });
      doc.moveDown(0.5);

      this.renderSectionHeader(doc, 'C. Energy Conservation Measures Summary Table:', sectionGrey);
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following table summarizes the energy conservation measures identified for this project, including estimated savings and financial metrics.', { align: 'left' });
      doc.moveDown(0.5);

      this.renderMeasuresTable(doc, measures);
      doc.moveDown(0.5);

      this.renderExistingConditions(doc, existingConditions, sectionGrey);
      doc.moveDown(1);

      this.renderRecommendedMeasures(doc, measures);
      doc.moveDown(2);

      this.renderMeasuresByStatus(doc, measures, 'implemented');
      doc.moveDown(2);

      this.renderImplementedMeasures(doc, measures);
      doc.moveDown(2);

      this.renderMeasuresToConsider(doc, measures);
      doc.moveDown(2);

      this.renderMeasuresRequiringInvestigation(doc, measures);
      this.renderEnergyStarBenchmarking(doc, energyStarData, sectionGrey);
      doc.moveDown(2);

      this.renderEnergyUseAnalysis(doc, { endUseBreakdown, totalUsage, monthlyData }, sectionGrey);
      doc.moveDown(2);

      this.renderTHERMSPieChart(doc, endUseBreakdown);
      doc.moveDown(2);

      this.renderWeatherEffects(doc, data, sectionGrey);
      doc.moveDown(2);

      this.renderWeatherCDDEffects(doc, data, sectionGrey);
      doc.moveDown(4);

      this.renderAggregatedConsumptionTable(doc, data)
      doc.moveDown(4);
   }

   private renderExistingConditions(doc: typeof PDFDocument, existingConditions: any, sectionGrey: string): void {
      doc.x = doc.page.margins.left;
      this.renderSectionHeader(doc, 'D. Existing Conditions and Observations:', sectionGrey);
      doc.moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('1. General Building Description');
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('a. Modernization need / proposed capital projects');
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(existingConditions?.modernizationNeeds || 'No modernization needs documented.');
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('b. Planned capital projects');
      doc.moveDown(0.5);

      const tableHeight = 60 + (existingConditions?.capitalProjects?.length || 1) * 20;
      if (doc.y + tableHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
      }

      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const columnWidths = [
         availableWidth * 0.20,
         availableWidth * 0.15,
         availableWidth * 0.15,
         availableWidth * 0.15,
         availableWidth * 0.15,
         availableWidth * 0.10,
         availableWidth * 0.10
      ];

      const headers = [
         'Project Name',
         'Status',
         'Equipment Type',
         'Expected Project Date',
         'Estimated Cost (£ known)',
         'Amount Budgeted',
         'Notes'
      ];

      const tableData = existingConditions?.capitalProjects?.length > 0
         ? existingConditions.capitalProjects.map((p: { name: any; status: any; equipmentType: any; expectedDate: any; estimatedCost: number | null | undefined; amountBudgeted: number | null | undefined; notes: any; }) => [
            p.name || '-',
            p.status || '-',
            p.equipmentType || '-',
            p.expectedDate || '-',
            p.estimatedCost ? `£${this.formatNumber(p.estimatedCost)}` : '-',
            p.amountBudgeted ? `£${this.formatNumber(p.amountBudgeted)}` : '-',
            p.notes || '-'
         ])
         : [['No capital projects available', '', '', '', '', '', '']];

      this.addSimpleTable(
         doc,
         headers,
         tableData,
         availableWidth,
         {
            columnWidths: columnWidths,
            columnAlignments: ['left', 'left', 'left', 'left', 'right', 'right', 'left'],
            headerBgColor: '#f5f5f5',
            headerTextColor: '#333333',
            zebra: true,
            zebraColors: { even: '#ffffff', odd: '#f9f9f9' },
            headerHeight: 50,
            rowHeight: 35,
            fontSize: { header: 9, body: 9 }
         }
      );
      doc.moveDown(1);

      doc.x = doc.page.margins.left;
      this.renderBuildingSystemSection(doc, '2. Building Envelope', existingConditions?.buildingEnvelope);

      this.renderBuildingSystemSection(doc, '3. Heating, Ventilation, Air Conditioning (HVAC) and Control Systems', existingConditions?.hvacSystems);

      this.renderBuildingSystemSection(doc, '4. Lighting system & Control', existingConditions?.lightingSystems);

      this.renderBuildingSystemSection(doc, '5. Domestic Hot Water', existingConditions?.hotWaterSystems);

      this.renderBuildingSystemSection(doc, '6. Other Equipment', existingConditions?.otherEquipment);

   }

   private renderBuildingSystemSection(doc: typeof PDFDocument, title: string, content: string): void {
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(title);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(content || ``);
   }

   private renderSectionHeader(doc: typeof PDFDocument, text: string, color: string): void {
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor(color)
         .font('Helvetica-Bold')
         .text(text, { align: 'left' });
   }

   private renderMeasuresTable(doc: typeof PDFDocument, measures: any[]): void {
      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10;
      const columnWidths = [
         Math.floor(availableWidth * 0.30),
         Math.floor(availableWidth * 0.17),
         Math.floor(availableWidth * 0.17),
         Math.floor(availableWidth * 0.20),
         Math.floor(availableWidth * 0.16)
      ];

      const headerCells = ['Measure', 'Annual Savings\n(kWh)', 'Cost Savings\n($)', 'Implementation\nCost ($)', 'Payback\n(years)'];
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

      const hasData = measures?.some(m => m.title || m.name || m.estimatedSavings || m.annualSavings);
      const requiredHeight = 40 + (hasData && measures ? measures.length * 35 : 35);

      if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
      }

      if (!hasData || !measures?.length) {
         this.addSimpleTable(
            doc,
            headerCells,
            [['No data found', 'N/A', 'N/A', 'N/A', 'N/A']],
            tableWidth,
            {
               columnWidths: columnWidths,
               columnAlignments: ['left', 'right', 'right', 'right', 'right'],
               headerBgColor: '#e6f2e6',
               headerTextColor: '#4A4A4A',
               zebra: false,
               fontSize: { header: 9, body: 10 }
            }
         );
      } else {
         const tableRows = measures.map(m => {
            const name = (m.title || m.name || 'N/A').substring(0, 40);
            const annualSavings = m.estimatedSavings?.energy || m.annualSavings;
            const costSavings = m.estimatedSavings?.cost || m.costSavings;
            const paybackPeriod = m.estimatedSavings?.paybackPeriod || m.paybackPeriod;
            let implementationCost = m.implementationCost || m.detailedCost?.total || 0;

            if (implementationCost === 0 && costSavings && paybackPeriod) {
               implementationCost = costSavings * paybackPeriod;
            }

            return [
               name,
               annualSavings ? this.formatNumber(annualSavings, 1) : 'N/A',
               costSavings ? this.formatCurrency(costSavings) : 'N/A',
               implementationCost ? this.formatCurrency(implementationCost) : 'N/A',
               paybackPeriod ? this.formatNumber(paybackPeriod, 1) : 'N/A'
            ];
         });

         this.addSimpleTable(
            doc,
            headerCells,
            tableRows,
            tableWidth,
            {
               columnWidths: columnWidths,
               columnAlignments: ['left', 'right', 'right', 'right', 'right'],
               headerBgColor: '#e6f2e6',
               headerTextColor: '#4A4A4A',
               zebra: true,
               zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
               headerHeight: 40,
               rowHeight: 35,
               fontSize: { header: 9, body: 10 }
            }
         );
      }
   }

   private renderMeasuresByStatus(doc: typeof PDFDocument, measures: any[], status: string): void {
      const filtered = measures?.filter(m => m.status === status) || [];
      const label = this.getStatusLabel(status);

      if (filtered.length > 0) {
         filtered.forEach(m => {
            if (doc.y > doc.page.height - doc.page.margins.bottom - 100) {
               doc.addPage();
            }

            const name = m.title || m.name || '';
            const desc = m.recommendation || m.description || '';
            const annual = m.estimatedSavings?.energy || m.annualSavings || 0;
            const cost = m.estimatedSavings?.cost || m.costSavings || 0;

            doc.fontSize(10)
               .fillColor('#000000')
               .font('Helvetica-Bold')
               .text(name)
               .moveDown(0.5)
               .font('Helvetica')
               .text(desc)
               .moveDown(0.5)
               .font('Helvetica-Bold')
               .text(`${label} Annual Savings: ${this.formatNumber(annual)} kWh (${this.formatCurrency(cost)})`)
               .moveDown(1);
         });
      } else {
         doc.fontSize(10)
            .font('Helvetica')
            .text(`No ${label.toLowerCase()} measures available.`);
      }
   }

   private renderImplementedMeasures(doc: typeof PDFDocument, measures: any[]): void {
      const filtered = measures?.filter(m => m.status === 'implemented') || [];

      // Section header - force left alignment
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('F. EEMs Already Implemented', { align: 'left' });
      doc.moveDown(0.5);

      // Introductory paragraph
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The management has taken proactive steps in increasing the energy efficiency of the property. The following upgraded equipment was observed to be installed during the site visit.');
      doc.moveDown(1);

      // List of implemented measures
      const measureCount = Math.max(filtered.length, 6);
      for (let i = 0; i < measureCount; i++) {
         const measureText = filtered[i]
            ? `${i + 1}. ${filtered[i].title || filtered[i].name || 'Implemented measure'}`
            : `${i + 1}. 555555555`;

         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(measureText);
      }
      doc.moveDown(1);

      // Supporting images header
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Supporting images:');
      doc.moveDown(0.5);

      // Image grid parameters
      const imageWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 20) / 2;
      const imageHeight = 100;
      const verticalSpaceNeeded = imageHeight + 30; // Image + padding

      // Check if we need a new page for images
      if (doc.y + verticalSpaceNeeded > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         doc.y = doc.page.margins.top; // Reset to top of new page
      }

      const startY = doc.y;

      // First row - two placeholder images
      this.renderImageWithLabel(doc, doc.page.margins.left, startY, imageWidth, imageHeight, "1");
      this.renderImageWithLabel(doc, doc.page.margins.left + imageWidth + 20, startY, imageWidth, imageHeight, "2");

      // Update Y position after images
      doc.y = startY + imageHeight + 15;
   }

   private renderImageWithLabel(doc: typeof PDFDocument, x: number, y: number, width: number, height: number, label: string): void {
      // Check again in case image rendering would cross page boundary
      if (y + height > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         y = doc.page.margins.top;
         x = doc.page.margins.left; // Reset X position for new page
      }

      // Image placeholder box
      doc.rect(x, y, width, height)
         .fill('#f5f5f5')
         .stroke('#cccccc');

      // Label in center of box
      doc.fontSize(10)
         .fillColor('#666666')
         .text(label, x + width / 2 - 3, y + height / 2 - 5, { align: 'center' });
   }

   private renderRecommendedMeasures(doc: typeof PDFDocument, measures: any[]): void {
      // Section header - force left alignment
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('E. Energy Efficiency Measures Recommended', { align: 'left' });
      doc.moveDown(0.5);

      // Introductory paragraph - force left alignment
      doc.x = doc.page.margins.left;
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The Energy Management Plan summarized below includes a series of energy efficiency measures (EEMs), which when implemented should secure energy cost reduction approaching those estimated for each measure. The development of this EEM plan is conceptual and will require additional technical due diligence, planning and design prior to implementation.', {
            align: 'left',
            lineGap: 4,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
         });
      doc.moveDown(2);

      // Path to assets folder
      const assetsPath = path.join(__dirname, '../../../../assets');

      // Create sample measures if none exist
      const measuresToRender = measures?.filter(m => m.status === 'recommended') || [];
      const sampleMeasures = Array(5).fill(null).map((_, i) => ({
         title: `EEM ${i + 1}: xxxxxxxxxxxx`,
         existingCondition: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
         recommendation: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
         images: [
            {
               id: `sample-id-${i}-1`,
               filename: "image2.png"
            },
            {
               id: `sample-id-${i}-2`,
               filename: "image2.png"
            }
         ]
      }));

      const finalMeasures = measuresToRender.length > 0 ? measuresToRender : sampleMeasures;

      finalMeasures.forEach((measure, index) => {
         // Reset to left margin for each measure
         doc.x = doc.page.margins.left;

         // Calculate required height for this measure
         const textHeight = 100; // Approximate height for text content
         const imageSectionHeight = 200; // Height for images and their labels

         // Check if we need a new page before starting this measure
         if (doc.y + textHeight + imageSectionHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            doc.x = doc.page.margins.left;
         }

         // Measure title - force left alignment
         doc.fontSize(11)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${measure.title || `EEM ${index + 1}: [Measure Name]`}`);
         doc.moveDown(0.75);

         // Existing Condition - force left alignment
         doc.x = doc.page.margins.left;
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Existing Condition:');
         doc.fontSize(10)
            .font('Helvetica')
            .text(measure.existingCondition || '', {
               indent: 10,
               lineGap: 3,
               width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 10
            });
         doc.moveDown(0.3);

         // Recommendation - force left alignment
         doc.x = doc.page.margins.left;
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Recommendation:');
         doc.fontSize(10)
            .font('Helvetica')
            .text(measure.recommendation || '', {
               indent: 10,
               lineGap: 3,
               width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 10
            });
         doc.moveDown(0.3);

         // Check again for image section - we need about 200 points of vertical space
         if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            doc.x = doc.page.margins.left;
         }

         // Supporting Images header - force left alignment
         doc.x = doc.page.margins.left;
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Supporting Images:');
         doc.moveDown(0.5);

         // Image parameters
         let imageWidth = 180;
         const imageHeight = 135;
         let imageMargin = 20;
         let currentX = doc.page.margins.left;

         // Calculate if images can fit in one row
         const images = measure.images || [];
         const totalImagesWidth = (imageWidth * images.length) + (imageMargin * (images.length - 1));
         const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

         if (totalImagesWidth > availableWidth) {
            // If images don't fit, reduce width and margin
            imageWidth = 150;
            imageMargin = 10;
         }

         // Initial Y position for images
         const imagesStartY = doc.y;

         // Render all images in a single row
         images.forEach((img: { filename: string; id: any; }, imgIndex: number) => {
            // Image number above the image
            doc.fontSize(10)
               .fillColor('#000000')
               .text(`${imgIndex + 1}`, currentX, imagesStartY, {
                  width: imageWidth,
                  align: 'center'
               });

            try {
               if (img.filename) {
                  const imagePath = path.join(assetsPath, img.filename);
                  if (fs.existsSync(imagePath)) {
                     doc.image(imagePath, currentX, imagesStartY + 15, {
                        width: imageWidth,
                        height: imageHeight,
                        align: 'center'
                     });
                  } else {
                     this.renderImagePlaceholder(doc, currentX, imagesStartY + 15, imageWidth, imageHeight);
                  }
               } else {
                  this.renderImagePlaceholder(doc, currentX, imagesStartY + 15, imageWidth, imageHeight);
               }
            } catch (e) {
               this.renderImagePlaceholder(doc, currentX, imagesStartY + 15, imageWidth, imageHeight);
            }

            // ID below the image
            doc.fontSize(8)
               .fillColor('#999999')
               .text(`ID: ${img.id || 'N/A'}`, currentX, imagesStartY + 15 + imageHeight + 5, {
                  width: imageWidth,
                  align: 'center'
               });

            // Move right for next image
            currentX += imageWidth + imageMargin;
         });

         // Set new Y position after images
         doc.y = imagesStartY + 15 + imageHeight + 25;
         doc.x = doc.page.margins.left; // Reset to left margin

         // If no images, show message
         if (images.length === 0) {
            doc.fontSize(10)
               .fillColor('#666666')
               .text('No supporting images available', { indent: 10 });
         }

         // Space between measures
         doc.moveDown(1.5);
      });
   }

   private renderImagePlaceholder(doc: typeof PDFDocument, x: number, y: number, width: number, height: number): void {
      doc.rect(x, y, width, height)
         .fill('#f5f5f5')
         .stroke('#cccccc');

      doc.fontSize(10)
         .fillColor('#666666')
         .text('Photo not available', x + 10, y + height / 2 - 10, {
            width: width - 20,
            align: 'center'
         });
   }

   private getStatusLabel(status: string): string {
      switch (status) {
         case 'recommended': return 'Estimated';
         case 'implemented': return 'Annual';
         case 'to_consider': return 'Potential';
         case 'requires_investigation': return 'Investigation Required';
         default: return '';
      }
   }

   private renderMeasuresToConsider(doc: typeof PDFDocument, measures: any[]): void {
      const filtered = measures?.filter(m => m.status === 'to_consider') || [];
      const placeholderText = 'xxxxxxxxx';

      // Section header
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('G. EEMs to Consider', { align: 'left' });
      doc.moveDown(0.5);

      // Introductory paragraph
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following measures have been identified to increase the energy efficiency of the property; however, these measures were priced using standard cost estimates, which were unable to justify the Return on Investment (ROI). Nonetheless, the viability of these measures should be investigated further by the client.', {
            align: 'left',
            lineGap: 4,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
         });
      doc.moveDown(1.5);

      // Render measures
      const measureCount = Math.max(filtered.length, 2);
      for (let i = 0; i < measureCount; i++) {
         const measure = filtered[i] || {};
         // Save starting Y position (removed unused variable)

         // Measure title/number
         doc.x = doc.page.margins.left;
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(`${i + 1}. ${measure.title || measure.name || 'XXXXXXXXXXXX'}`);
         doc.moveDown(0.5);

         // Existing Condition
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`Existing Condition: ${measure.existingCondition || placeholderText}`);
         doc.moveDown(0.5);

         // Recommendation
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`Recommendation: ${measure.recommendation || placeholderText}`);
         doc.moveDown(0.5);

         // Supporting Images header
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Supporting Images:');
         doc.moveDown(0.5);

         // Image parameters
         // Render two images in a row
         const imageWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 20) / 2;
         const imageHeight = 80;
         const imagesStartY = doc.y;

         this.renderImageBoxPlaceholder(doc, doc.page.margins.left, imagesStartY, imageWidth, imageHeight);
         this.renderImageBoxPlaceholder(doc, doc.page.margins.left + imageWidth + 20, imagesStartY, imageWidth, imageHeight);

         // Update Y position after images
         doc.y = imagesStartY + imageHeight + 15;

         // Add space between measures, but don't let it push content off the page
         if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = doc.page.margins.top;
         } else {
            doc.moveDown(1.5);
         }
      }
   }

   private renderImageBoxPlaceholder(doc: typeof PDFDocument, x: number, y: number, width: number, height: number): void {
      // Draw a light gray box
      doc.rect(x, y, width, height)
         .fill('#f5f5f5')
         .stroke('#cccccc');

      // Add "Photo not available" centered in the box
      doc.fontSize(8)
         .fillColor('#666666')
         .text('Photo not available', x, y + height / 2 - 5, {
            width: width,
            align: 'center'
         });
   }

   private renderMeasuresRequiringInvestigation(doc: typeof PDFDocument, measures: any[]): void {
      const filtered = measures?.filter(m => m.status === 'requires_investigation') || [];
      const placeholderText = 'XXXXXXXXXX';
      const assetsPath = path.join(__dirname, '..', '..', '..', '..', 'assets');
      const sectionGrey = '#4A4A4A';
      const vertProImagePath = path.join(assetsPath, 'image1.png'); // VertPro ad image path

      // Section header
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('H. EEMs Requiring Further Investigation', { align: 'left' });
      doc.moveDown(0.5);

      // Introductory paragraph
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following section outlines additional energy efficiency measures which require greater study and testing to determine the climate feasibility. The required tests exceed the scope of this study. However, these measures are encouraged to be investigated further.', {
            align: 'left',
            lineGap: 4,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
         });
      doc.moveDown(1.5);

      // Render measures
      const measureCount = Math.max(filtered.length, 1);
      for (let i = 0; i < measureCount; i++) {
         const measure = filtered[i] || {};
         const startY = doc.y;

         // Check if we need a new page
         if (startY > doc.page.height - 300) {
            doc.addPage();
            doc.y = doc.page.margins.top;
         }

         // Measure number and title
         doc.x = doc.page.margins.left;
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(`${i + 1}. ${measure.title || measure.name || placeholderText}`);
         doc.moveDown(0.5);

         // Existing Condition
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`Existing Condition: ${measure.existingCondition || placeholderText}`);
         doc.moveDown(0.5);

         // Recommendation
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`Recommendation: ${measure.recommendation || placeholderText}`);
         doc.moveDown(0.5);

         // Supporting Images header
         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Supporting Images:');
         doc.moveDown(0.5);

         // Image parameters
         const imageWidth = 150;
         const imageHeight = 100;
         const imageMargin = 20;
         const imagesPerRow = 2;
         const imagesStartY = doc.y;

         // Check if we have images for this measure
         const images = measure.images || [];
         const imagesToShow = Math.max(images.length, imagesPerRow);

         // Calculate starting X position to center the images
         const totalRowWidth = (imageWidth * imagesPerRow) + (imageMargin * (imagesPerRow - 1));
         const startX = (doc.page.width - totalRowWidth) / 2;

         // Render all images in a single row
         for (let imgIndex = 0; imgIndex < imagesToShow; imgIndex++) {
            const xPos = startX + (imgIndex * (imageWidth + imageMargin));

            if (images[imgIndex]?.filename) {
               try {
                  const imagePath = path.join(assetsPath, images[imgIndex].filename);
                  if (fs.existsSync(imagePath)) {
                     doc.image(imagePath, xPos, imagesStartY, {
                        width: imageWidth,
                        height: imageHeight
                     });

                     if (images[imgIndex].caption) {
                        doc.fontSize(8)
                           .fillColor('#666666')
                           .text(images[imgIndex].caption, xPos, imagesStartY + imageHeight + 5, {
                              width: imageWidth,
                              align: 'center'
                           });
                     }
                     continue;
                  }
               } catch (e) {
                  console.error('Error loading image:', e);
               }
            }

            // Fallback to placeholder if no image available
            this.renderImageBoxPlaceholder(doc, xPos, imagesStartY, imageWidth, imageHeight);
         }

         // Update Y position after the entire row of images
         doc.y = imagesStartY + imageHeight + 20; // Fixed space after images
         doc.moveDown(0.5);

         // Add VertPro advertisement image at the bottom of the last measure
         if (i === measureCount - 1) {
            this.renderVertProAdvertisement(doc, vertProImagePath);
         }

         doc.moveDown(1.5);
      }
   }

   private renderVertProAdvertisement(doc: typeof PDFDocument, imagePath: string): void {
      // Check if we need a new page for the advertisement
      if (doc.y > doc.page.height - 150) { // 150 is approximate ad height + margin
         doc.addPage();
         doc.y = doc.page.margins.top;
      } else {
         doc.moveDown(1);
      }

      const adWidth = 400; // Adjust based on your image aspect ratio
      const adHeight = 200; // Adjust based on your image aspect ratio
      const centerX = (doc.page.width - adWidth) / 2;

      try {
         if (fs.existsSync(imagePath)) {
            doc.image(imagePath, centerX, doc.y, {
               width: adWidth,
               height: adHeight
            });
            doc.y += adHeight + 10;
         } else {
            console.error('VertPro advertisement image not found at:', imagePath);
            doc.x = doc.page.margins.left;
            this.renderVertProTextAdvertisement(doc);
         }
      } catch (e) {
         console.error('Error loading VertPro ad image:', e);
         this.renderVertProTextAdvertisement(doc);
      }
   }

   private renderVertProTextAdvertisement(doc: typeof PDFDocument): void {
      const brandGreen = '#4d9b58';
      doc.x = doc.page.margins.left;
      doc.fontSize(10)
         .fillColor(brandGreen)
         .font('Helvetica-Bold')
         .text('Save time on your', { align: 'center' });
      doc.fontSize(12)
         .text('Energy Upgrades with the', { align: 'center' });
      doc.fontSize(14)
         .text('VertPro.com/Upgrades', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10)
         .text('Get 3 Qualified Bids For', { align: 'center' });
      doc.fontSize(10)
         .text('Every Project You Post.', { align: 'center' });
      doc.fontSize(8)
         .text('Guaranteed', { align: 'center' });
   }

   private renderEnergyStarBenchmarking(doc: typeof PDFDocument, energyStarData: any, sectionGrey: string): void {
      // Reset layout
      doc.x = doc.page.margins.left;

      // Section title
      this.renderSectionHeader(doc, 'I. Current ENERGY STAR® Benchmarking Test:', sectionGrey);
      doc.moveDown(0.5);

      // Explanation text with proper line spacing
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Using the Environmental Protection Agency\'s Portfolio Manager software, an analysis of 12-month electricity and natural gas usage has determined that this property receives an energy benchmark score on an energy consumption. Benchmarking a building\'s energy use is similar to an MPG rating for vehicles or an EnergyGuide label for appliances; it allows for comparison with similar buildings. This score is the benchmark rating for a facility relative to similar buildings nationwide and normalized for weather conditions. The benchmark rating is based on the facility source energy, level of business activity, and geographical location.', {
            lineGap: 4,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
         });
      doc.moveDown(0.5);

      // Expert note with proper formatting
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Expert note if no score is generated:');
      doc.fontSize(10)
         .font('Helvetica')
         .text('Make sure the year used to generate this score is the same as the one in our Utility Table');
      doc.moveDown(1);


      this.renderEnergyStarStatement(doc, energyStarData);
      doc.moveDown(1);
   
      // Energy Use Index information with dynamic data
      const siteEUI = energyStarData?.siteEUI || '88.9';
      const nationalMedianEUI = energyStarData?.nationalMedianEUI || '92.9';
      const sourceEUI = energyStarData?.sourceEUI || '140.0';
      const percentageOfMedian = energyStarData?.percentageOfMedian || '96.0%';

      doc.fontSize(10)
         .font('Helvetica')
         .text(`Currently the facility has a Site Energy Use Index (EUI) of ${siteEUI} kBtu/ft² with a national median EUI of ${nationalMedianEUI} kBtu/ft² per square foot and a Source Energy Use Index of ${sourceEUI} kBtu/ft² with a national median Source EUI per square foot. The building Site Energy Use Index is ${percentageOfMedian} of the national median.`);

      doc.moveDown(1);

      // Energy consumption table with dynamic data
      const tableHeaders = ['Site EUI', 'Annual Energy by Fuel', 'Annual Energy Cost', 'National Median Comparison'];
      const tableData = [
         [
            `${siteEUI} kBtu/ft²`,
            `Electricity (kBtu): ${energyStarData?.electricityUsage || '1,985,400'} (${energyStarData?.electricityPercentage || '59%'})\nNatural Gas (kBtu): ${energyStarData?.gasUsage || '1,399,900'} (${energyStarData?.gasPercentage || '41%'})`,
            `$${energyStarData?.annualEnergyCost || '89,000'}`,
            `National Median Site EUI (kBtu/ft²): ${nationalMedianEUI}\nSite EUI from National Median Source EUI: ${energyStarData?.euiComparison || '-4%'}\nAnnual Source Energy (kBtu): ${energyStarData?.annualSourceEnergy || '4,886,000'}\nGreenhouse Gas Emissions Metric Tons CO₂e/year: ${energyStarData?.greenhouseGasEmissions || '174'}`
         ]
      ];

      this.addSimpleTable(
         doc,
         tableHeaders,
         tableData,
         doc.page.width - doc.page.margins.left - doc.page.margins.right,
         {
            columnWidths: [70, 120, 70, 250],
            columnAlignments: ['center', 'left', 'left', 'left'],
            headerBgColor: '#E6E6E6',
            headerTextColor: '#000000',
            zebra: false,
            headerHeight: 40,
            rowHeight: this.calculateRowHeight(tableData[0]), // Dynamic row height
            fontSize: { header: 9, body: 9 }
         }
      );
   }

   private renderEnergyStarStatement(doc: typeof PDFDocument, data: any): void {
      const statementHeight = 190;
      
      if (doc.y + statementHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top; 
      }
      
      const startY = doc.y;
      
      // Box dimensions
      const boxWidth = 500;
      const boxHeight = statementHeight;
      const boxX = (doc.page.width - boxWidth) / 2; 
      
      // Draw outer border
      doc.rect(boxX, startY, boxWidth, boxHeight)
         .lineWidth(1)
         .stroke('#000000');
      
      doc.rect(boxX, startY, boxWidth, 60)
         .fillAndStroke('#33A1DE', '#000000');
      
      doc.rect(boxX + 5, startY + 5, 50, 50)
         .lineWidth(1)
         .fillAndStroke('#FFFFFF', '#000000');
      
      // Add "LEARN MORE AT energystar.gov" text
      doc.fontSize(6)
         .fillColor('#FFFFFF')
         .font('Helvetica')
         .text('LEARN MORE AT', boxX + 5, startY + 30)
         .text('energystar.gov', boxX + 5, startY + 38);
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('ENERGY STAR ®Statement of Energy', boxX + 70, startY + 15)
         .moveUp(0.2);
      
      doc.fontSize(8)
         .text('®', doc.x, doc.y);
      
      doc.fontSize(14)
         .text('Performance', boxX + 70, startY + 35);
      
      doc.rect(boxX, startY + 60, boxWidth, boxHeight - 60)
         .fill('#F0F4FA');
      
      doc.fontSize(60)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(data?.energyStarScore ?? '55', boxX + 30, startY + 75, { width: 80 });
      
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('ENERGY STAR', boxX + 30, startY + 145);
      
      doc.fontSize(6)
         .text('®', doc.x, doc.y);
      
      doc.fontSize(10)
         .text('score¹', boxX + 30, startY + 160);
      
      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(data?.propertyAddress ?? '5348 Newcastle Avenue', boxX + 200, startY + 75);
      
      // Property type
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Primary Property Type:', boxX + 200, startY + 100);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(data?.primaryPropertyType ?? 'Multifamily Housing', boxX + 310, startY + 100);
      
      // Gross Floor Area
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Gross Floor Area (ft²):', boxX + 200, startY + 115);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(data?.grossFloorArea ?? '70,506', boxX + 310, startY + 115);
      
      // Built year
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Built:', boxX + 200, startY + 130);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(data?.builtYear ?? '1959', boxX + 310, startY + 130);
      
      // For Year Ending
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('For Year Ending:', boxX + 200, startY + 145);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(data?.forYearEnding ?? 'December 31, 2019', boxX + 310, startY + 145);
      
      // Date Generated
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Date Generated:', boxX + 200, startY + 160);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(data?.dateGenerated ?? 'April 16, 2020', boxX + 310, startY + 160);
      
      // Add footnote
      doc.fontSize(6)
         .fillColor('#000000')
         .font('Helvetica')
         .text('¹ The ENERGY STAR score is a 1-100 assessment of a building\'s energy efficiency as compared with similar buildings nationwide, adjusting for climate and business activity.', 
               boxX + 10, startY + boxHeight - 15, { width: boxWidth - 20 });
      
      // Update doc.y to after the statement
      doc.y = startY + boxHeight + 10;
    }

   private calculateRowHeight(rowData: string[]): number {
      // Calculate row height based on line breaks in data
      const maxLines = Math.max(...rowData.map(cell => cell.split('\n').length));
      return 20 + (maxLines * 15); // Base height + line height
   }

   private renderEnergyUseAnalysis(doc: typeof PDFDocument, data: any, sectionGrey: string): void {
      const { monthlyData } = data;

      // Reset layout
      doc.x = doc.page.margins.left;

      // Check if we need a new page
      if (doc.y > doc.page.height - doc.page.margins.bottom - 150) {
         doc.addPage();
         doc.x = doc.page.margins.left;
      }

      // Section title
      this.renderSectionHeader(doc, 'J. Energy Use Analysis:', sectionGrey);
      doc.moveDown(0.5);

      // Introduction text
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('This energy analysis presents an energy analysis of purchased electricity and natural gas by end use. Approach C includes a tabular summary of electricity and natural gas usage values over a one (1) year period in addition to a detailed analysis of the effects of weather on energy consumption.');
      doc.moveDown(0.5);

      // Note about analysis approach
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`Note: This utility analysis is based on ${data.analysisPeriod || '[AUDIT TIME PERIOD]'} covering ${data.startDate || '[START]'} and ${data.endDate || '[FINISH]'}.`);

      doc.moveDown(0.5);

      // Billing information
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Each month\'s electric and gas usage are metered and billed individually by LADWP and SoCalGas respectively.');

      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('The commons areas gas and electric usage are metered separately and paid by the building owner(s) / Management.');

      doc.moveDown(1);

      // Observations text
      doc.fontSize(10)
         .font('Helvetica')
         .text('The following observations, table and graphs summarize the results of the annual electricity and natural gas usage and cost analysis.');

      doc.moveDown(1);

      // Electricity analysis
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('1. Aggregated Electricity');

      doc.fontSize(10)
         .font('Helvetica')
         .text(`This timeframe has electric billing data from ${data.startDate || '[January 2022]'} through ${data.endDate || '[December 2022]'}. During this period the building consumed a total of ${this.formatNumber(data.totalConsumption || 0)} kWh of electricity. The chart below shows monthly electricity usage and costs.`);

      doc.moveDown(1);

      // Check if we need a new page for chart
      if (doc.y > doc.page.height - doc.page.margins.bottom - 300) {
         doc.addPage();
         doc.x = doc.page.margins.left;
      }

      // Create and render the graph
      this.renderMonthlyUsageChart(doc, monthlyData);
      doc.moveDown(1);

      // Gas analysis
      doc.x = doc.page.margins.left;
      doc.moveDown(1);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('1. Aggregated Natural Gas ');

      doc.fontSize(10)
         .font('Helvetica')
         .text(`This building purchases natural gas from SoCal Gas at an estimated rate from ${data.startDate || '[January 2022]'} through ${data.endDate || '[December 2022]'}. During this period the building consumed a total of ${this.formatNumber(data.totalConsumption || 0)} therms . The chart below shows monthly Gas usage and costs.`);

      doc.moveDown(1);

      // Check if we need a new page for chart
      if (doc.y > doc.page.height - doc.page.margins.bottom - 300) {
         doc.addPage();
         doc.x = doc.page.margins.left;
      }

      // Create and render the graph
      this.renderMonthlyGasUsageChart(doc, monthlyData);
      doc.moveDown(1);

      this.renderEnergyEndUseCharts(doc, data, sectionGrey);
      doc.moveDown(1);

   }

   private renderMonthlyUsageChart(doc: typeof PDFDocument, _monthlyData: { month: string; usage: number; cost: number }[]): void {
      const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 40;
      const chartHeight = 260;
      const chartX = doc.page.margins.left + 20;
      const chartY = doc.y;

      doc.rect(chartX, chartY, chartWidth, chartHeight)
         .fill('#ffffff')
         .stroke('#cccccc');

      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Monthly Electric Usage Vs Cost', chartX, chartY + 10, {
            width: chartWidth,
            align: 'center'
         });

      const margin = 40;
      const graphWidth = chartWidth - 2 * margin;
      const graphHeight = chartHeight - 80;
      const graphX = chartX + margin;
      const graphY = chartY + 50;

      interface MonthlyData {
         month: string;
         usage: number;
         cost: number;
      }

      const staticMonthlyData: MonthlyData[] = [
         { month: 'January', usage: 1000, cost: 200 },
         { month: 'February', usage: 1200, cost: 250 },
         { month: 'March', usage: 1100, cost: 230 },
         { month: 'April', usage: 1300, cost: 270 },
         { month: 'May', usage: 1400, cost: 300 },
         { month: 'June', usage: 1500, cost: 320 },
         { month: 'July', usage: 1600, cost: 350 },
         { month: 'August', usage: 1700, cost: 370 },
         { month: 'September', usage: 1500, cost: 310 },
         { month: 'October', usage: 1400, cost: 290 },
         { month: 'November', usage: 1300, cost: 260 },
         { month: 'December', usage: 1200, cost: 240 },
      ];

      const maxUsage = Math.max(...staticMonthlyData.map(d => d.usage));
      const maxCost = Math.max(...staticMonthlyData.map(d => d.cost));
      const scaleY = graphHeight / Math.max(maxUsage, maxCost * 7.5);

      // Axes
      doc.moveTo(graphX, graphY)
         .lineTo(graphX, graphY + graphHeight)
         .lineTo(graphX + graphWidth, graphY + graphHeight)
         .stroke('#333333');

      // Y-axis grid and labels (left - usage)
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
         const y = graphY + graphHeight - (i * graphHeight / steps);
         const value = Math.round((i * maxUsage / steps) / 1000) * 1000;

         doc.moveTo(graphX, y)
            .lineTo(graphX + graphWidth, y)
            .strokeColor('#e0e0e0')
            .stroke();

         doc.fontSize(8)
            .fillColor('#333333')
            .text(`${value}`, graphX - 30, y - 5);
      }

      // Y-axis labels (right - cost)
      for (let i = 0; i <= steps; i++) {
         const y = graphY + graphHeight - (i * graphHeight / steps);
         const value = Math.round((i * maxCost / steps) / 100) * 100;

         doc.fontSize(8)
            .fillColor('#333333')
            .text(`$${value}`, graphX + graphWidth + 5, y - 5);
      }

      // X-axis labels (rotated)
      const monthWidth = graphWidth / staticMonthlyData.length;
      staticMonthlyData.forEach((data, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth / 2);
         const label = `${data.month.slice(0, 3)} 2025`;

         const labelX = x - 15; // shift slightly left
         const labelY = graphY + graphHeight + 20; // push label down

         doc.save();
         doc.fontSize(8)
            .fillColor('#333333')
            .rotate(-40, { origin: [x, labelY] })
            .text(label, labelX, labelY, {
               width: 40,
               align: 'center'
            });
         doc.restore();
      });

      // Bars
      const barGroupWidth = monthWidth * 0.8;
      const barWidth = barGroupWidth / 2;

      staticMonthlyData.forEach((data, i) => {
         const xGroupStart = graphX + (i * monthWidth) + (monthWidth - barGroupWidth) / 2;

         // Usage bar (light green)
         const usageHeight = data.usage * scaleY;
         const usageX = xGroupStart;
         doc.rect(usageX, graphY + graphHeight - usageHeight, barWidth, usageHeight)
            .fill('#87dcc0')
            .stroke('#87dcc0');

         // Cost bar (light blue)
         const costHeight = data.cost * scaleY * 7.5;
         const costX = xGroupStart + barWidth;
         doc.rect(costX, graphY + graphHeight - costHeight, barWidth, costHeight)
            .fill('#89b6ff')
            .stroke('#89b6ff');
      });

      // Legend (moved lower to avoid overlap)
      const legendY = chartY + chartHeight + 10;

      doc.rect(graphX + 10, legendY, 10, 10)
         .fill('#87dcc0')
         .stroke('#87dcc0');
      doc.fontSize(8)
         .fillColor('#333333')
         .text('Electric Usage (kWh)', graphX + 25, legendY + 1);

      doc.rect(graphX + 140, legendY, 10, 10)
         .fill('#89b6ff')
         .stroke('#89b6ff');
      doc.fontSize(8)
         .fillColor('#333333')
         .text('Electric Cost ($)', graphX + 155, legendY + 1);

      // Move doc.y below legend for next section
      doc.y = legendY + 20;

   }

   private renderMonthlyGasUsageChart(doc: typeof PDFDocument, _monthlyData: { month: string; usage: number; cost: number }[]): void {
      const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 40;
      const chartHeight = 260;
      const chartX = doc.page.margins.left + 20;
      const chartY = doc.y;

      doc.rect(chartX, chartY, chartWidth, chartHeight)
         .fill('#ffffff')
         .stroke('#cccccc');

      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Monthly Gas Usage Vs Cost', chartX, chartY + 10, {
            width: chartWidth,
            align: 'center'
         });

      const margin = 40;
      const graphWidth = chartWidth - 2 * margin;
      const graphHeight = chartHeight - 80;
      const graphX = chartX + margin;
      const graphY = chartY + 50;

      interface MonthlyData {
         month: string;
         usage: number;
         cost: number;
      }

      const staticMonthlyData: MonthlyData[] = [
         { month: 'January', usage: 1000, cost: 200 },
         { month: 'February', usage: 1200, cost: 250 },
         { month: 'March', usage: 1100, cost: 230 },
         { month: 'April', usage: 1300, cost: 270 },
         { month: 'May', usage: 1400, cost: 300 },
         { month: 'June', usage: 1500, cost: 320 },
         { month: 'July', usage: 1600, cost: 350 },
         { month: 'August', usage: 1700, cost: 370 },
         { month: 'September', usage: 1500, cost: 310 },
         { month: 'October', usage: 1400, cost: 290 },
         { month: 'November', usage: 1300, cost: 260 },
         { month: 'December', usage: 1200, cost: 240 },
      ];

      const maxUsage = Math.max(...staticMonthlyData.map(d => d.usage));
      const maxCost = Math.max(...staticMonthlyData.map(d => d.cost));
      const scaleY = graphHeight / Math.max(maxUsage, maxCost * 7.5);

      // Axes
      doc.moveTo(graphX, graphY)
         .lineTo(graphX, graphY + graphHeight)
         .lineTo(graphX + graphWidth, graphY + graphHeight)
         .stroke('#333333');

      // Y-axis grid and labels (left - usage)
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
         const y = graphY + graphHeight - (i * graphHeight / steps);
         const value = Math.round((i * maxUsage / steps) / 1000) * 1000;

         doc.moveTo(graphX, y)
            .lineTo(graphX + graphWidth, y)
            .strokeColor('#e0e0e0')
            .stroke();

         doc.fontSize(8)
            .fillColor('#333333')
            .text(`${value}`, graphX - 30, y - 5);
      }

      // Y-axis labels (right - cost)
      for (let i = 0; i <= steps; i++) {
         const y = graphY + graphHeight - (i * graphHeight / steps);
         const value = Math.round((i * maxCost / steps) / 100) * 100;

         doc.fontSize(8)
            .fillColor('#333333')
            .text(`$${value}`, graphX + graphWidth + 5, y - 5);
      }

      // X-axis labels (rotated)
      const monthWidth = graphWidth / staticMonthlyData.length;
      staticMonthlyData.forEach((data, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth / 2);
         const label = `${data.month.slice(0, 3)} 2025`;

         const labelX = x - 15; // shift slightly left
         const labelY = graphY + graphHeight + 20; // push label down

         doc.save();
         doc.fontSize(8)
            .fillColor('#333333')
            .rotate(-40, { origin: [x, labelY] })
            .text(label, labelX, labelY, {
               width: 40,
               align: 'center'
            });
         doc.restore();
      });

      // Bars
      const barGroupWidth = monthWidth * 0.8;
      const barWidth = barGroupWidth / 2;

      staticMonthlyData.forEach((data, i) => {
         const xGroupStart = graphX + (i * monthWidth) + (monthWidth - barGroupWidth) / 2;

         // Usage bar (light green)
         const usageHeight = data.usage * scaleY;
         const usageX = xGroupStart;
         doc.rect(usageX, graphY + graphHeight - usageHeight, barWidth, usageHeight)
            .fill('#87dcc0')
            .stroke('#87dcc0');

         // Cost bar (light blue)
         const costHeight = data.cost * scaleY * 7.5;
         const costX = xGroupStart + barWidth;
         doc.rect(costX, graphY + graphHeight - costHeight, barWidth, costHeight)
            .fill('#89b6ff')
            .stroke('#89b6ff');
      });

      // Legend (moved lower to avoid overlap)
      const legendY = chartY + chartHeight + 10;

      doc.rect(graphX + 10, legendY, 10, 10)
         .fill('#87dcc0')
         .stroke('#87dcc0');
      doc.fontSize(8)
         .fillColor('#333333')
         .text('Gas Usage (kWh)', graphX + 25, legendY + 1);

      doc.rect(graphX + 140, legendY, 10, 10)
         .fill('#89b6ff')
         .stroke('#89b6ff');
      doc.fontSize(8)
         .fillColor('#333333')
         .text('Gas Cost ($)', graphX + 155, legendY + 1);

      // Move doc.y below legend for next section
      doc.y = legendY + 20;

   }

   private renderEnergyEndUseCharts(doc: typeof PDFDocument, endUseData: any, sectionGrey: string): void {
      // Section header
      doc.x = doc.page.margins.left;
      this.renderSectionHeader(doc, '3. Building Energy End Use Charts', sectionGrey);
      doc.moveDown(0.5);

      // Description text
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following charts show the breakdown of energy use in the building by end-use category. These visualizations help identify largest energy consumers and potential areas for conservation measures.');
      doc.moveDown(1.5);

      // Check if we need a new page for the chart
      if (doc.y > doc.page.height - doc.page.margins.bottom - 250) {
         doc.addPage();
         doc.x = doc.page.margins.left;
      }

      // Draw the pie chart
      this.renderEndUsePieChart(doc, endUseData?.energyUsage?.breakdown);
      doc.moveDown(2);

      this.renderEnergyBreakdownPieChart(doc);
   }

   private renderEndUsePieChart(doc: PDFKit.PDFDocument, endUseData: any): void {
      try {
         // ===== 1. Configuration Constants =====
         const CHART_DIAMETER = 200;
         const MARGIN = 20;
         const LEFT_MARGIN = 50; // Added to match the first function
         const LEGEND_CONFIG = {
            swatchSize: 12,
            textOffset: 8,
            fontSize: 10,
            itemHeight: 18,
            verticalGap: 4,
            legendLeftMargin: 30
         };

         // Add border configuration from first function
         const BORDER_PADDING = 15;
         const BORDER_RADIUS = 8;
         const BORDER_COLOR = '#e0e0e0';
         const BORDER_WIDTH = 1.5;

         // ===== 2. Data Preparation =====
         const defaultData = [
            { category: 'Cooling', percentage: 43, color: '#4d9b58' },
            { category: 'Lighting', percentage: 24, color: '#3498db' },
            { category: 'Cooking', percentage: 15, color: '#e74c3c' },
            { category: 'Heating', percentage: 11, color: '#f39c12' },
            { category: 'Ventilation', percentage: 4, color: '#9b59b6' },
            { category: 'Other', percentage: 3, color: '#95a5a6' }
         ];

         // Validate and normalize data
         let validData = this.validateAndNormalizeData(endUseData, defaultData);

         // ===== 3. Calculate Container Dimensions =====
         const legendWidth = 150;
         const containerWidth = CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin + legendWidth;
         const containerHeight = CHART_DIAMETER + 50;

         // Border coordinates (outer box)
         const borderX = doc.page.margins.left + LEFT_MARGIN - BORDER_PADDING;
         const borderY = doc.y - BORDER_PADDING + 10;

         // ===== 4. Draw Container Border =====
         doc.save()
            .roundedRect(borderX, borderY,
               containerWidth + (BORDER_PADDING * 2),
               containerHeight + (BORDER_PADDING * 2),
               BORDER_RADIUS)
            .fillOpacity(0)
            .stroke(BORDER_COLOR)
            .lineWidth(BORDER_WIDTH)
            .restore();


         // ===== 6. Calculate Chart Positions =====
         const chartX = doc.page.margins.left + LEFT_MARGIN;
         const chartY = doc.y + 30; // Extra space for title
         const centerX = chartX + (CHART_DIAMETER / 2);
         const centerY = chartY + (CHART_DIAMETER / 2);
         const radius = CHART_DIAMETER / 2;

         // ===== 7. Add Title =====
         const titleText = 'COMBINED FUEL END-USE BREAKDOWN - KBTU';
         const TITLE_TOP_MARGIN = 15; // Added top margin for the title

         doc.font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#333333');

         // Calculate text width and center it horizontally in container
         const textWidth = doc.widthOfString(titleText);
         const titleX = borderX + (containerWidth + (BORDER_PADDING * 2)) / 2 - textWidth / 2;
         const titleY = borderY + TITLE_TOP_MARGIN;

         doc.text(titleText, titleX, titleY);
         doc.y = titleY + 20;

         // ===== 8. Draw Pie Chart =====
         let startAngle = 0;
         validData.forEach(item => {
            const sectorAngle = (item.percentage / 100) * 360;

            doc.save()
               .moveTo(centerX, centerY)
               .lineTo(centerX, centerY - radius)
               .path(`M ${centerX} ${centerY} L ${centerX + radius * Math.cos(startAngle * Math.PI / 180)} ${centerY + radius * Math.sin(startAngle * Math.PI / 180)} A ${radius} ${radius} 0 ${sectorAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos((startAngle + sectorAngle) * Math.PI / 180)} ${centerY + radius * Math.sin((startAngle + sectorAngle) * Math.PI / 180)} Z`)
               .lineTo(centerX, centerY)
               .fill(item.color)
               .stroke('#ffffff')
               .restore();

            startAngle += sectorAngle;
         });

         // ===== 9. Draw Vertical Legend =====
         const legendX = chartX + CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin;
         const totalLegendHeight = validData.length * LEGEND_CONFIG.itemHeight +
            (validData.length - 1) * LEGEND_CONFIG.verticalGap;
         let currentY = centerY - (totalLegendHeight / 2);

         doc.font('Helvetica')
            .fontSize(LEGEND_CONFIG.fontSize);

         validData.forEach(item => {
            const labelText = `${item.category}: ${item.percentage}%`;
            const swatchY = currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.swatchSize) / 2;

            // Draw color swatch
            doc.rect(legendX, swatchY,
               LEGEND_CONFIG.swatchSize, LEGEND_CONFIG.swatchSize)
               .fill(item.color)
               .stroke('#e0e0e0');

            // Draw text
            doc.fillColor('#212121')
               .text(labelText,
                  legendX + LEGEND_CONFIG.swatchSize + LEGEND_CONFIG.textOffset,
                  currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.fontSize) / 2,
                  { width: 150, lineBreak: false });

            currentY += LEGEND_CONFIG.itemHeight + LEGEND_CONFIG.verticalGap;
         });

         // ===== 10. Update Document Position =====
         doc.y = chartY + CHART_DIAMETER + MARGIN + 10;

      } catch (error) {
         console.error('Pie chart rendering error:', error);
         this.renderErrorFallback(doc, 'Energy Use Data Not Available');
      }
   }

   private validateAndNormalizeData(inputData: any, defaults: any[]): any[] {
      let validData = [];

      if (!inputData || !Array.isArray(inputData)) {
         return [...defaults];
      }

      validData = inputData.map(item => ({
         category: item?.category || 'Unknown',
         percentage: Math.max(0, Number(item?.percentage) || 0),
         color: item?.color || this.getRandomColor()
      })).filter(item => item.percentage > 0);

      if (validData.length === 0) {
         return [...defaults];
      }

      // Normalize percentages to sum to 100
      const total = validData.reduce((sum, item) => sum + item.percentage, 0);
      return validData.map(item => ({
         ...item,
         percentage: Math.round((item.percentage / total) * 100)
      }));
   }

   private getRandomColor(): string {
      const colors = ['#4d9b58', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#34495e'];
      return colors[Math.floor(Math.random() * colors.length)];
   }

   private renderErrorFallback(doc: PDFKit.PDFDocument, message: string): void {
      doc.fontSize(10)
         .fillColor('#ff0000')
         .text(message, doc.page.margins.left, doc.y);
      doc.y += 20;
   }

   private renderEnergyBreakdownPieChart(doc: PDFKit.PDFDocument): void {
      try {
         // ===== 1. Configuration Constants =====
         const CHART_DIAMETER = 200;
         const MARGIN = 20;
         const LEFT_MARGIN = 50;
         const LEGEND_CONFIG = {
            swatchSize: 12,
            textOffset: 8,
            fontSize: 10,
            itemHeight: 18,
            verticalGap: 4,
            legendLeftMargin: 30
         };
         const BORDER_PADDING = 15;
         const BORDER_RADIUS = 8;
         const BORDER_COLOR = '#e0e0e0';
         const BORDER_WIDTH = 1.5;

         // ===== 2. Data Preparation =====
         const chartData = [
            { category: 'Cooling', percentage: 35, color: '#4CAF50' },
            { category: 'Lighting', percentage: 20, color: '#2196F3' },
            { category: 'Refrigeration', percentage: 18, color: '#FF9800' },
            { category: 'Heating', percentage: 9, color: '#FFC107' },
            { category: 'Office Equipment', percentage: 7, color: '#F44336' },
            { category: 'Laundry', percentage: 5, color: '#00BCD4' },
            { category: 'Ventilation', percentage: 5, color: '#9C27B0' },
            { category: 'Other', percentage: 3, color: '#9E9E9E' }
         ];

         // ===== 3. Calculate Container Dimensions =====
         const legendWidth = 150;
         const containerWidth = CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin + legendWidth;
         const containerHeight = CHART_DIAMETER + 50;

         // Border coordinates (outer box)
         const borderX = doc.page.margins.left + LEFT_MARGIN - BORDER_PADDING;
         const borderY = doc.y - BORDER_PADDING + 10;

         // ===== 4. Draw Container Border =====
         doc.save()
            .roundedRect(borderX, borderY,
               containerWidth + (BORDER_PADDING * 2),
               containerHeight + (BORDER_PADDING * 2),
               BORDER_RADIUS)
            .fillOpacity(0)
            .stroke(BORDER_COLOR)
            .lineWidth(BORDER_WIDTH)
            .restore();

         // ===== 3. Calculate Positions =====
         const chartX = doc.page.margins.left + LEFT_MARGIN;
         const chartY = doc.y + 30; // Extra space for title
         const centerX = chartX + (CHART_DIAMETER / 2);
         const centerY = chartY + (CHART_DIAMETER / 2);
         const radius = CHART_DIAMETER / 2;

         // ===== 4. Add Title (Matches reference image) =====
         const titleText = 'END-USE BREAKDOWN BY KWH';
         const TITLE_TOP_MARGIN = 15; // Added top margin for the title

         doc.font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#333333');

         // Calculate text width and center it horizontally in container
         const textWidth = doc.widthOfString(titleText);
         const titleX = borderX + (containerWidth + (BORDER_PADDING * 2)) / 2 - textWidth / 2;
         const titleY = borderY + TITLE_TOP_MARGIN;

         doc.text(titleText, titleX, titleY);
         doc.y = titleY + 20;

         // ===== 5. Draw Pie Chart =====
         let startAngle = 0;
         chartData.forEach(item => {
            const sectorAngle = (item.percentage / 100) * 360;

            doc.save()
               .moveTo(centerX, centerY)
               .lineTo(centerX, centerY - radius)
               .path(`M ${centerX} ${centerY} L ${centerX + radius * Math.cos(startAngle * Math.PI / 180)} ${centerY + radius * Math.sin(startAngle * Math.PI / 180)} A ${radius} ${radius} 0 ${sectorAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos((startAngle + sectorAngle) * Math.PI / 180)} ${centerY + radius * Math.sin((startAngle + sectorAngle) * Math.PI / 180)} Z`)
               .lineTo(centerX, centerY)
               .fill(item.color)
               .stroke('#ffffff')
               .restore();

            startAngle += sectorAngle;
         });

         // ===== 6. Draw Vertical Legend =====
         const legendX = chartX + CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin;
         const totalLegendHeight = chartData.length * LEGEND_CONFIG.itemHeight +
            (chartData.length - 1) * LEGEND_CONFIG.verticalGap;
         let currentY = centerY - (totalLegendHeight / 2);

         doc.font('Helvetica')
            .fontSize(LEGEND_CONFIG.fontSize);

         chartData.forEach(item => {
            const labelText = `${item.category}: ${item.percentage}%`;
            const swatchY = currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.swatchSize) / 2;

            // Draw color swatch with exact colors from reference
            doc.rect(legendX, swatchY,
               LEGEND_CONFIG.swatchSize, LEGEND_CONFIG.swatchSize)
               .fill(item.color)
               .stroke('#e0e0e0');

            // Draw text with perfect alignment
            doc.fillColor('#212121') // Dark gray text like reference
               .text(labelText,
                  legendX + LEGEND_CONFIG.swatchSize + LEGEND_CONFIG.textOffset,
                  currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.fontSize) / 2,
                  { width: 150, lineBreak: false });

            currentY += LEGEND_CONFIG.itemHeight + LEGEND_CONFIG.verticalGap;
         });

         // ===== 7. Update Document Position =====
         doc.y = chartY + CHART_DIAMETER + MARGIN + 10;

      } catch (error) {
         console.error('Pie chart rendering error:', error);
         this.renderErrorFallback(doc, 'Energy Breakdown Data Not Available');
      }
   }

   private renderTHERMSPieChart(doc: PDFKit.PDFDocument, endUseData: any): void {
      try {
         // ===== 1. Configuration Constants =====
         const CHART_DIAMETER = 200;
         const MARGIN = 20;
         const LEFT_MARGIN = 50;
         const LEGEND_CONFIG = {
            swatchSize: 12,
            textOffset: 8,
            fontSize: 10,
            itemHeight: 18,
            verticalGap: 4,
            legendLeftMargin: 30
         };

         // Add border configuration from first function
         const BORDER_PADDING = 15;
         const BORDER_RADIUS = 8;
         const BORDER_COLOR = '#e0e0e0';
         const BORDER_WIDTH = 1.5;
         const TITLE_TOP_MARGIN = 15;

         // ===== 2. Check for page break =====
         const estimatedChartHeight = CHART_DIAMETER + 100; // Includes chart, title, legend and margins
         if (doc.y + estimatedChartHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            doc.y = doc.page.margins.top; // Reset Y position for new page
         }

         // ===== 3. Data Preparation =====
         const defaultData = [
            { category: 'Water Heating', percentage: 53, color: '#2A67BB' },
            { category: 'Laundry', percentage: 27, color: '#D02129' },
            { category: 'Cooking', percentage: 20, color: '#97C15C' },
         ];

         // Validate and normalize data
         let validData = this.validateAndNormalizeData(endUseData, defaultData);

         // ===== 4. Calculate Container Dimensions =====
         const legendWidth = 150;
         const containerWidth = CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin + legendWidth;
         const containerHeight = CHART_DIAMETER + 50;

         // Border coordinates (outer box)
         const borderX = doc.page.margins.left + LEFT_MARGIN - BORDER_PADDING;
         const borderY = doc.y - BORDER_PADDING + 10;

         // ===== 5. Draw Container Border =====
         doc.save()
            .roundedRect(borderX, borderY,
               containerWidth + (BORDER_PADDING * 2),
               containerHeight + (BORDER_PADDING * 2),
               BORDER_RADIUS)
            .fillOpacity(0)
            .stroke(BORDER_COLOR)
            .lineWidth(BORDER_WIDTH)
            .restore();

         // ===== 6. Calculate Chart Positions =====
         const chartX = doc.page.margins.left + LEFT_MARGIN;
         const chartY = doc.y + 30; // Extra space for title
         const centerX = chartX + (CHART_DIAMETER / 2);
         const centerY = chartY + (CHART_DIAMETER / 2);
         const radius = CHART_DIAMETER / 2;

         // ===== 7. Add Title =====
         const titleText = 'END-USE BREAKDOWN INPUT BY THERMS';
         doc.font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#333333');

         // Calculate text width and center it horizontally in container
         const textWidth = doc.widthOfString(titleText);
         const titleX = borderX + (containerWidth + (BORDER_PADDING * 2)) / 2 - textWidth / 2;
         const titleY = borderY + TITLE_TOP_MARGIN;

         doc.text(titleText, titleX, titleY);
         doc.y = titleY + 20;

         // ===== 8. Draw Pie Chart =====
         let startAngle = 0;
         validData.forEach(item => {
            const sectorAngle = (item.percentage / 100) * 360;

            doc.save()
               .moveTo(centerX, centerY)
               .lineTo(centerX, centerY - radius)
               .path(`M ${centerX} ${centerY} L ${centerX + radius * Math.cos(startAngle * Math.PI / 180)} ${centerY + radius * Math.sin(startAngle * Math.PI / 180)} A ${radius} ${radius} 0 ${sectorAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos((startAngle + sectorAngle) * Math.PI / 180)} ${centerY + radius * Math.sin((startAngle + sectorAngle) * Math.PI / 180)} Z`)
               .lineTo(centerX, centerY)
               .fill(item.color)
               .stroke('#ffffff')
               .restore();

            startAngle += sectorAngle;
         });

         // ===== 9. Draw Vertical Legend =====
         const legendX = chartX + CHART_DIAMETER + LEGEND_CONFIG.legendLeftMargin;
         const totalLegendHeight = validData.length * LEGEND_CONFIG.itemHeight +
            (validData.length - 1) * LEGEND_CONFIG.verticalGap;
         let currentY = centerY - (totalLegendHeight / 2);

         doc.font('Helvetica')
            .fontSize(LEGEND_CONFIG.fontSize);

         validData.forEach(item => {
            const labelText = `${item.category}: ${item.percentage}%`;
            const swatchY = currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.swatchSize) / 2;

            // Draw color swatch
            doc.rect(legendX, swatchY,
               LEGEND_CONFIG.swatchSize, LEGEND_CONFIG.swatchSize)
               .fill(item.color)
               .stroke('#e0e0e0');

            // Draw text
            doc.fillColor('#212121')
               .text(labelText,
                  legendX + LEGEND_CONFIG.swatchSize + LEGEND_CONFIG.textOffset,
                  currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.fontSize) / 2,
                  { width: 150, lineBreak: false });

            currentY += LEGEND_CONFIG.itemHeight + LEGEND_CONFIG.verticalGap;
         });

         // ===== 10. Update Document Position =====
         doc.y = chartY + CHART_DIAMETER + MARGIN + 10;

      } catch (error) {
         console.error('Pie chart rendering error:', error);
         this.renderErrorFallback(doc, 'Energy Use Data Not Available');
      }
   }

   private renderWeatherEffects(doc: typeof PDFDocument, _data: any, sectionGrey: string): void {
      doc.moveDown(4);

      doc.x = doc.page.margins.left;
      this.renderSectionHeader(doc, '4. Weather Effects on Energy Use', sectionGrey);
      doc.moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('a. Gas Usage and Heating Degree Days');
      doc.moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The heating degree days (HDD) are used in comparison to actual gas consumption. This analysis does not apply to this building since space heating is provided by electric resistance.');
      doc.moveDown(1);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('b. Electric Usage and Heating Degree Days');
      doc.moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The heating degree days (HDD) are used in comparison to actual electric consumption. This analysis shows that the electric consumption during the heating season follows the HDD trend.');
      doc.moveDown(1);

      const chartHeight = 250;
      if (doc.y + chartHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         doc.y = doc.page.margins.top;
      }

      if (doc.y + chartHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         doc.y = doc.page.margins.top;
      }

      this.renderElectricUsageChart(doc);
      doc.moveDown(1);
   }

   private renderElectricUsageChart(doc: typeof PDFDocument): void {
      const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const chartHeight = 250;
      const chartX = doc.page.margins.left;
      const chartY = doc.y;

      doc.rect(chartX, chartY, chartWidth, chartHeight)
         .fill('#ffffff')
         .stroke('#cccccc');

      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Gas Usage and HDD', chartX, chartY + 10, {
            width: chartWidth,
            align: 'center'
         });

      const graphX = chartX + 60;
      const graphY = chartY + 40;
      const graphWidth = chartWidth - 80;
      const graphHeight = chartHeight - 80;

      doc.moveTo(graphX, graphY)
         .lineTo(graphX, graphY + graphHeight)
         .lineTo(graphX + graphWidth, graphY + graphHeight)
         .stroke('#333333');

      const yLabels = [0, 50, 100, 150, 200, 250, 300];
      const yStep = graphHeight / (yLabels.length - 1);

      yLabels.forEach((label, i) => {
         const yPos = graphY + graphHeight - (i * yStep);

         doc.fontSize(8)
            .fillColor('#333333')
            .text(label.toString(), graphX - 25, yPos - 5);

         doc.moveTo(graphX - 5, yPos)
            .lineTo(graphX, yPos)
            .stroke('#333333');
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthWidth = graphWidth / months.length;

      months.forEach((month, i) => {
         const xPos = graphX + (i * monthWidth) + (monthWidth / 2);

         doc.fontSize(8)
            .fillColor('#333333')
            .text(month, xPos - 10, graphY + graphHeight + 5);

         doc.moveTo(xPos, graphY + graphHeight)
            .lineTo(xPos, graphY + graphHeight + 5)
            .stroke('#333333');
      });

      const hddData = [250, 230, 200, 150, 100, 50, 20, 30, 80, 150, 200, 240];
      const cddData = [10, 15, 30, 50, 100, 180, 220, 200, 150, 80, 40, 20];

      const maxValue = 300;
      const normalize = (value: number) => (value / maxValue) * graphHeight;

      const barWidth = monthWidth * 0.6;
      hddData.forEach((value, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth - barWidth) / 2;
         const height = normalize(value);

         doc.rect(x, graphY + graphHeight - height, barWidth, height)
            .fill('#fddb87')
            .stroke('#fddb87');
      });

      doc.moveTo(graphX, graphY + graphHeight - normalize(cddData[0]));
      cddData.forEach((value, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth / 2);
         const y = graphY + graphHeight - normalize(value);
         doc.lineTo(x, y);
      });
      doc.stroke('#ff4f72').lineWidth(2);

      const legendY = chartY + chartHeight - 20;
      doc.fontSize(9)
         .fillColor('#fddb87')
         .text('• HDD', graphX + 20, legendY)
         .fillColor('#ff4f72')
         .text('• CDD', graphX + 80, legendY)
         .fillColor('#fddb87')

      doc.fontSize(8)
         .fillColor('#333333')
         .text('MMBtu', graphX - 40, graphY + graphHeight / 2 - 20, {
            width: 30,
            align: 'center'
         });
   }

   private renderWeatherCDDEffects(doc: typeof PDFDocument, _data: any, _sectionGrey: string): void {
      doc.moveDown(11);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('C. Electric Usage and Cooling Degree Days');
      doc.moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The heating degree days (HDD) are used in comparison to actual gas consumption. This analysis does not apply to this building since space heating is provided by electric resistance.');
      doc.moveDown(1);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('In general, electric usage is affected by increases in CDDs. Typically, energy usage closely follows seasonal variations and changes from this pattern are likely due to buildings control systems and occupant behavior.');
      doc.moveDown(1);

      const chartHeight = 250;
      if (doc.y + chartHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         doc.y = doc.page.margins.top;
      }

      if (doc.y + chartHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
         doc.y = doc.page.margins.top;
      }

      this.renderElectricCDDUsageChart(doc);
      doc.moveDown(1);
   }

   private renderElectricCDDUsageChart(doc: typeof PDFDocument): void {
      const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const chartHeight = 240;
      const chartX = doc.page.margins.left;
      const chartY = doc.y;

      doc.rect(chartX, chartY, chartWidth, chartHeight)
         .fill('#ffffff')
         .stroke('#cccccc');

      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Electric Usage and CDD', chartX, chartY + 10, {
            width: chartWidth,
            align: 'center'
         });

      const graphX = chartX + 60;
      const graphY = chartY + 30;
      const graphWidth = chartWidth - 80;
      const graphHeight = chartHeight - 80;

      doc.moveTo(graphX, graphY)
         .lineTo(graphX, graphY + graphHeight)
         .lineTo(graphX + graphWidth, graphY + graphHeight)
         .stroke('#333333');

      const yLabels = [0, 50, 100, 150, 200, 250, 300];
      const yStep = graphHeight / (yLabels.length - 1);

      yLabels.forEach((label, i) => {
         const yPos = graphY + graphHeight - (i * yStep);

         doc.fontSize(8)
            .fillColor('#333333')
            .text(label.toString(), graphX - 25, yPos - 5);

         doc.moveTo(graphX - 5, yPos)
            .lineTo(graphX, yPos)
            .stroke('#333333');
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthWidth = graphWidth / months.length;

      months.forEach((month, i) => {
         const xPos = graphX + (i * monthWidth) + (monthWidth / 2);

         doc.fontSize(8)
            .fillColor('#333333')
            .text(month, xPos - 10, graphY + graphHeight + 5);

         doc.moveTo(xPos, graphY + graphHeight)
            .lineTo(xPos, graphY + graphHeight + 5)
            .stroke('#333333');
      });

      const electricData = [120, 110, 100, 90, 85, 80, 95, 110, 120, 130, 140, 150];
      const cddData = [10, 15, 30, 50, 100, 180, 220, 200, 150, 80, 40, 20];

      const maxValue = 300;
      const normalize = (value: number) => (value / maxValue) * graphHeight;

      doc.moveTo(graphX, graphY + graphHeight - normalize(cddData[0]));
      cddData.forEach((value, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth / 2);
         const y = graphY + graphHeight - normalize(value);
         doc.lineTo(x, y);
      });
      doc.stroke('#ff4f72').lineWidth(2);

      const barWidth = monthWidth * 0.6;
      electricData.forEach((value, i) => {
         const x = graphX + (i * monthWidth) + (monthWidth - barWidth) / 2;
         const height = normalize(value);

         doc.rect(x, graphY + graphHeight - height, barWidth, height)
            .fill('#fddb87')
            .stroke('#fddb87');
      });

      const legendY = chartY + chartHeight - 20;
      doc.fontSize(9)
         .fillColor('#ff4f72')
         .text('• CDD', graphX + 80, legendY)
         .fillColor('#fddb87')
         .text('• Electric (MMBtu)', graphX + 140, legendY);

      doc.fontSize(8)
         .fillColor('#333333')
         .text('MMBtu', graphX - 40, graphY + graphHeight / 2 - 20, {
            width: 30,
            align: 'center'
         });
   }
 
   private renderAggregatedConsumptionTable(doc: typeof PDFDocument, data: any): void {
      // Check if we need a new page for this table
      if (doc.y + 300 > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
      }
    
      // Reset to left margin
      doc.x = doc.page.margins.left;
      
      // Section header
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('5. Aggregated Electric and Gas Consumption Table', { align: 'left' });
      doc.moveDown(1);
    
      // Get monthly data from the data object, or use placeholder data if not provided
      const monthlyData = data.monthlyData || this.getPlaceholderMonthlyData();
      
      // Calculate column widths
      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      
      // Define column groups and their widths as proportions of availableWidth
      const columnGroups = [
         { title: "WEATHER DATA (60°F)", columns: ['HDD', 'CDD'], width: 0.14 },
         { title: "ELECTRICITY USE DATA", columns: ['kWh Usage', 'Total Cost', 'Avg Cost/kWh', 'Electric MMBtu'], width: 0.34 },
         { title: "GAS USE DATA", columns: ['Therms', 'Total Gas Charges', 'Cost/Therm', 'Gas MMBtu'], width: 0.34 }
      ];
      
      // Calculate individual column widths within each group
      const columnWidths: number[] = [];
      const groupWidths: number[] = [];
      const headers: string[] = ['Month', 'Year'];
      
      // First two columns (Month, Year)
      columnWidths.push(availableWidth * 0.07); // Month
      columnWidths.push(availableWidth * 0.05); // Year
      
      // Add other headers and calculate widths
      columnGroups.forEach(group => {
         const groupWidth = availableWidth * group.width;
         groupWidths.push(groupWidth);
         
         const colWidth = groupWidth / group.columns.length;
         group.columns.forEach(colTitle => {
            headers.push(colTitle);
            columnWidths.push(colWidth);
         });
      });
      
      // Create table rows from monthly data
      interface MonthlyData {
         month: string;
         year: number;
         hdd: number;
         cdd: number;
         kwhUsage: number;
         electricCost: number;
         electricCostPerKwh: number;
         electricMMBtu: number;
         therms: number;
         gasCost: number;
         gasCostPerTherm: number;
         gasMMBtu: number;
      }
    
      const tableRows: string[][] = monthlyData.map((month: MonthlyData): string[] => {
         return [
           month.month || '',
           (month.year !== undefined && month.year !== null) ? month.year.toString() : '',
           (month.hdd !== undefined && month.hdd !== null) ? month.hdd.toString() : '0',
           (month.cdd !== undefined && month.cdd !== null) ? month.cdd.toString() : '0',
           (month.kwhUsage !== undefined && month.kwhUsage !== null) ? month.kwhUsage.toString() : '0',
           `$${(month.electricCost !== undefined && month.electricCost !== null) ? month.electricCost.toString() : '0'}`,
           `$${(month.electricCostPerKwh !== undefined && month.electricCostPerKwh !== null) ? month.electricCostPerKwh.toString() : '0'}`,
           (month.electricMMBtu !== undefined && month.electricMMBtu !== null) ? month.electricMMBtu.toString() : '0',
           (month.therms !== undefined && month.therms !== null) ? month.therms.toString() : '0',
           `$${(month.gasCost !== undefined && month.gasCost !== null) ? month.gasCost.toString() : '0'}`,
           `$${(month.gasCostPerTherm !== undefined && month.gasCostPerTherm !== null) ? month.gasCostPerTherm.toString() : '0'}`,
           (month.gasMMBtu !== undefined && month.gasMMBtu !== null) ? month.gasMMBtu.toString() : '0'
         ];
      });
      
      // Add totals row
      const totalsRow = this.calculateTotalsRow(monthlyData);
      tableRows.push(totalsRow);
      
      // Render the main consumption table
      this.renderTableWithGroupHeaders(
         doc,
         headers,
         tableRows,
         columnWidths,
         columnGroups,
         groupWidths
      );
      
      doc.moveDown(1);
      
      // Render the energy summary table
      this.renderEnergySummaryTable(doc, data);
    }
    
    private renderTableWithGroupHeaders(
      doc: typeof PDFDocument, 
      headers: string[], 
      rows: string[][], 
      columnWidths: number[],
      columnGroups: { title: string, columns: string[], width: number }[],
      groupWidths: number[]
    ): void {
      const startY = doc.y;
      let currentX = doc.page.margins.left;
      const headerHeight = 20;
      const rowHeight = 20;
      
      // Draw group headers
      doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
      
      // Month and Year columns (no group header)
      currentX += columnWidths[0] + columnWidths[1];
      
      // Group headers
      columnGroups.forEach((group, index) => {
         // Draw group header background
         doc.rect(currentX, startY, groupWidths[index], headerHeight)
            .fill(group.title.includes('WEATHER') ? '#90EE90' : // Light green
                 group.title.includes('ELECTRICITY') ? '#ADD8E6' : // Light blue
                 '#FFD700')  // Gold for gas
            .stroke('#000000');
         
         // Draw group header text
         doc.fillColor('#000000')
            .text(group.title, 
                  currentX + 5, 
                  startY + 5, 
                  { width: groupWidths[index] - 10, align: 'center' });
         
         currentX += groupWidths[index];
      });
      
      // Draw column headers
      const columnHeaderY = startY + headerHeight;
      currentX = doc.page.margins.left;
      
      headers.forEach((header, index) => {
         // Draw header cell background
         doc.rect(currentX, columnHeaderY, columnWidths[index], headerHeight)
            .fill('#E6E6E6')
            .stroke('#000000');
         
         // Draw header text
         doc.fontSize(8)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(header, 
                  currentX + 2, 
                  columnHeaderY + 6, 
                  { width: columnWidths[index] - 4, align: 'center' });
         
         currentX += columnWidths[index];
      });
      
      // Draw data rows
      let rowY = columnHeaderY + headerHeight;
      
      rows.forEach((row, rowIndex) => {
         currentX = doc.page.margins.left;
         
         // Highlight the "TOTAL" row with a different color
         const isTotal = row[0] === 'TOTAL';
         
         row.forEach((cell, cellIndex) => {
            // Determine cell background color
            let bgColor = '#FFFFFF'; // Default white background
            
            if (isTotal) {
               bgColor = '#F0F0F0'; // Light gray for totals row
            } else if (rowIndex % 2 === 1) {
               bgColor = '#F9F9F9'; // Very light gray for odd rows (zebra pattern)
            }
            
            // Draw cell background
            doc.rect(currentX, rowY, columnWidths[cellIndex], rowHeight)
               .fill(bgColor)
               .stroke('#CCCCCC');
            
            // Format cell text specially for the data cells
            let cellText = cell;
            let textColor = '#000000';
            
            // Make non-zero data values show in cyan (like in the example)
            if (cellIndex > 1 && cell !== '0' && !isNaN(parseFloat(cell.replace('$', '')))) {
               // Only color numeric cells that aren't zero
               if (cell !== '0') {
                  textColor = '#00BFFF'; // Cyan color similar to the example
               }
            }
            
            // Draw cell text
            doc.fontSize(8)
               .fillColor(textColor)
               .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
               .text(cellText, 
                     currentX + 2, 
                     rowY + 6, 
                     { width: columnWidths[cellIndex] - 4, align: 'center' });
            
            currentX += columnWidths[cellIndex];
         });
         
         rowY += rowHeight;
      });
      
      // Update doc.y to after the table
      doc.y = rowY + 10;
    }
    
    private renderEnergySummaryTable(doc: typeof PDFDocument, data: any): void {
      // Energy summary table headers and data
      const summaryHeaders = ['Energy Summary Table', ''];
      const summaryData = [
         ['Effective Electrical $/kWh', data.effectiveElectricalCostPerKwh || '$0.00'],
         ['Effective Electrical $/MMBtu', data.effectiveElectricalCostPerMMBtu || '$0.00'],
         ['Effective Gas $/Therms', data.effectiveGasCostPerTherm || '$0.00'],
         ['Effective Gas $/MMBtu', data.effectiveGasCostPerMMBtu || '$0.00'],
         ['Gross Conditioned Area', (data.grossConditionedArea || '0') + ' ft²'],
         ['EUI (kBtu/ft²)', data.eui || '$0.00'],
         ['ECI ($/ft²)', data.eci || '$0.00']
      ];
      
      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidths = [availableWidth * 0.3, availableWidth * 0.2];
      
      // Create table rows
      let startY = doc.y;
      
      // Draw the summary table header
      doc.rect(doc.page.margins.left, startY, colWidths[0] + colWidths[1], 20)
         .fill('#E6E6E6')
         .stroke('#000000');
      
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(summaryHeaders[0], 
              doc.page.margins.left + 5, 
              startY + 6, 
              { width: colWidths[0] - 10 });
      
      // Draw the summary table rows
      startY += 20;
      
      summaryData.forEach((row, rowIndex) => {
         // Draw row background
         doc.rect(doc.page.margins.left, startY, colWidths[0], 20)
            .fill(rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F9F9')
            .stroke('#CCCCCC');
         
         doc.rect(doc.page.margins.left + colWidths[0], startY, colWidths[1], 20)
            .fill(rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F9F9')
            .stroke('#CCCCCC');
         
         // Draw row text
         doc.fontSize(8)
            .fillColor('#000000')
            .font('Helvetica')
            .text(row[0], 
                 doc.page.margins.left + 5, 
                 startY + 6, 
                 { width: colWidths[0] - 10 });
         
         // Format the value cell specially with cyan color
         let valueColor = '#00BFFF'; // Cyan color similar to the example
         if (row[1] === '0' || row[1] === '0 ft²' || row[1] === '$0.00') {
            valueColor = '#000000'; // Black for zero values
         }
         
         doc.fontSize(8)
            .fillColor(valueColor)
            .text(row[1], 
                 doc.page.margins.left + colWidths[0] + 5, 
                 startY + 6, 
                 { width: colWidths[1] - 10, align: 'center' });
         
         startY += 20;
      });
      
      // Update doc.y to after the table
      doc.y = startY + 10;
    }
    
    private calculateTotalsRow(monthlyData: any[]): string[] {
      // Calculate totals for numeric columns
      let totalKwhUsage = 0;
      let totalElectricCost = 0;
      let totalElectricMMBtu = 0;
      let totalTherms = 0;
      let totalGasCost = 0;
      let totalGasMMBtu = 0;
      let totalHDD = 0;
      let totalCDD = 0;
      
      monthlyData.forEach(month => {
        totalKwhUsage += parseFloat(month.kwhUsage?.toString() || '0');
        totalElectricCost += parseFloat(month.electricCost?.toString() || '0');
        totalElectricMMBtu += parseFloat(month.electricMMBtu?.toString() || '0');
        totalTherms += parseFloat(month.therms?.toString() || '0');
        totalGasCost += parseFloat(month.gasCost?.toString() || '0');
        totalGasMMBtu += parseFloat(month.gasMMBtu?.toString() || '0');
        totalHDD += parseFloat(month.hdd?.toString() || '0');
        totalCDD += parseFloat(month.cdd?.toString() || '0');
      });
      
      // Calculate average cost per unit
      const avgElectricCostPerKwh = totalKwhUsage > 0 ? totalElectricCost / totalKwhUsage : 0;
      const avgGasCostPerTherm = totalTherms > 0 ? totalGasCost / totalTherms : 0;
      
      // Return the totals row
      return [
        'TOTAL',
        '',
        totalHDD.toString(),
        totalCDD.toString(),
        totalKwhUsage.toString(),
        `$${totalElectricCost.toFixed(2)}`,
        `$${avgElectricCostPerKwh.toFixed(4)}`,
        totalElectricMMBtu.toString(),
        totalTherms.toString(),
        `$${totalGasCost.toFixed(2)}`,
        `$${avgGasCostPerTherm.toFixed(4)}`,
        totalGasMMBtu.toString()
      ];
    }
    
    private getPlaceholderMonthlyData(): any[] {
      // Return placeholder data for all 12 months if no actual data provided
      const months = [
         'January', 'February', 'March', 'April', 'May', 'June',
         'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      return months.map(month => ({
         month,
         year: 2021,
         hdd: 0,
         cdd: 0,
         kwhUsage: 0,
         electricCost: 0,
         electricCostPerKwh: 0,
         electricMMBtu: 0,
         therms: 0,
         gasCost: 0,
         gasCostPerTherm: 0,
         gasMMBtu: 0
      }));
    }
   
   


}

