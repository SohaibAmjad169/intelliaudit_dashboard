import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';
import * as path from 'path';
import * as fs from 'fs';


@Injectable()
export class RetroCommissioningComponent extends BaseReportComponent {
   /**
    * Renders the retro-commissioning section of the report
    * @param doc PDFKit document
    * @param data Object containing retro-commissioning data
    */
   render(doc: typeof PDFDocument, data: any): void {
      // Extract data with default empty values to prevent null/undefined errors
      const {
         findings = [],
         recommendations = [],
         projectData = {},
         teamMembers = [],
         measures
      } = data || {};

      // Reset layout
      this.resetPageLayout(doc);

      // Brand colors
      const brandGreen = '#4d9b58';
      const sectionGrey = '#4A4A4A';

      // Section title (Roman numeral)
      doc.fontSize(18)
         .fillColor(brandGreen)
         .font('Helvetica-Bold')
         .text('VII.   Retro-Commissioning Report', { align: 'left' });
      doc.moveDown();



      // A. Introduction
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('A. Introduction:', { align: 'left' });

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('This section provides a comprehensive analysis of the building\'s systems performance and identifies opportunities for optimization through retro-commissioning.');
      doc.moveDown(0.5);

      // B. Retro-Commissioning Procedures
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('B. Retro-Commissioning Procedures:', { align: 'left' });

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The retro-commissioning process was conducted following established procedures, including:');
      doc.moveDown(0.5);

      const procedures = [
         'Review of existing documentation and system design',
         'On-site inspection and functional testing of systems',
         'Identification of operational issues and inefficiencies',
         'Development of corrective measures and optimization strategies',
         'Documentation of findings and recommendations'
      ];

      procedures.forEach(procedure => {
         doc.fontSize(10)
            .text(`• ${procedure}`);
      });
      doc.moveDown(0.5);

      // C. RCMs Cost Savings Summary Table
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('C. RCMs Cost Savings Summary Table:', { align: 'left' });

      // Add a brief description
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following table summarizes the retro-commissioning measures identified for this project, including estimated savings and financial metrics.', { align: 'left' });
      doc.moveDown();

      // Calculate available width based on page margins
      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10; // 10px buffer

      // Distribute column widths proportionally
      const columnWidths = [
         Math.floor(availableWidth * 0.30), // Measure (30%)
         Math.floor(availableWidth * 0.17), // Annual Savings (17%)
         Math.floor(availableWidth * 0.17), // Cost Savings (17%)
         Math.floor(availableWidth * 0.20), // Implementation Cost (20%)
         Math.floor(availableWidth * 0.16)  // Payback (16%)
      ];

      const headerCells = ['Measure', 'Annual Savings\n(kWh)', 'Cost Savings\n($)', 'Implementation\nCost ($)', 'Payback\n(years)'];
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

      // Check if we have any valid data
      const hasData = recommendations?.some((rec: any) =>
         (rec.name?.trim()) ||
         rec.annualSavings ||
         rec.costSavings ||
         rec.implementationCost ||
         rec.paybackPeriod
      );

      // Check page space and add new page if needed
      const requiredHeight = 40 + (hasData && recommendations ? recommendations.length * 35 : 35);
      if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
         doc.addPage();
      }

      if (!hasData || !recommendations || recommendations.length === 0) {
         // If no data, show "No data found" message using the simple table
         this.addSimpleTable(
            doc,
            headerCells,
            [['No retro-commissioning recommendations available', 'N/A', 'N/A', 'N/A', 'N/A']],
            tableWidth,
            {
               columnWidths: columnWidths,
               columnAlignments: ['left', 'right', 'right', 'right', 'right'],
               headerBgColor: '#e6f2e6',
               headerTextColor: sectionGrey,
               zebra: false,
               fontSize: { header: 9, body: 10 }
            }
         );
      } else {
         // Prepare data rows
         const tableRows = recommendations.map((rec: any) => {
            // Get values from either format (old or new)
            let name = rec.name || 'N/A';
            // Truncate name if it's too long to fit in the column
            const maxNameLength = 40; // Maximum characters for name
            if (name.length > maxNameLength) {
               name = name.substring(0, maxNameLength - 3) + '...';
            }

            const annualSavings = rec.annualSavings;
            const costSavings = rec.costSavings;
            const implementationCost = rec.implementationCost;
            const paybackPeriod = rec.paybackPeriod;

            // Format values with consistent decimal places
            return [
               name,
               annualSavings ? this.formatNumber(annualSavings) : 'N/A',
               costSavings ? this.formatCurrency(costSavings) : 'N/A',
               implementationCost ? this.formatCurrency(implementationCost) : 'N/A',
               paybackPeriod ? this.formatNumber(paybackPeriod, 1) : 'N/A'
            ];
         });

         // Render the table using the enhanced addSimpleTable method
         this.addSimpleTable(
            doc,
            headerCells,
            tableRows,
            tableWidth,
            {
               columnWidths: columnWidths,
               columnAlignments: ['left', 'right', 'right', 'right', 'right'],
               headerBgColor: '#e6f2e6',
               headerTextColor: sectionGrey,
               zebra: true,
               zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
               headerHeight: 40,
               rowHeight: 35,
               fontSize: { header: 9, body: 10 }
            }
         );
      }
      doc.moveDown(0.5);
      doc.x = doc.page.margins.left;


      // D. Existing Conditions and Observations
      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('D. Existing Conditions and Observations:', { align: 'left' });

      const proced = [
         'In general, the following items summarize the project steps. Some of the steps may not apply to your project.',
         'Review existing systems and related documentation',
         'Develop Retro-Commissioning Plan',
         'Implement diagnostic monitoring / trending',
         'Perform functional tests',
         'Analyze the monitoring / trending and test data',
         'Assess and document the current operating strategies and sequences of operation for all systems and equipment included',
         'Document O&M improvement opportunities',
         'Calculate energy impacts and develop implementation cost estimates for O&M opportunities',
         'Develop and deliver the Final Retro-Commissioning Report'
      ];

      proced.forEach(procedure => {
         doc.fontSize(10)
            .fillColor('black')
            .font('Helvetica')
            .text(`• ${procedure}`);
      });
      doc.moveDown(0.5);


      // Add null check for findings array
      if (findings && Array.isArray(findings)) {
         findings.forEach((finding: any) => {
            doc.fontSize(12)
               .fillColor('#000000')
               .font('Helvetica-Bold')
               .text(finding.title);
            doc.moveDown(0.5);

            doc.fontSize(10)
               .font('Helvetica')
               .text(finding.description);
            doc.moveDown(0.5);

            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text(`Impact: ${finding.impact}`);
            doc.moveDown(1);
         });
         doc.moveDown(0.5);
      } else {
         // If no findings, add a message
         doc.text('No retro-commissioning findings available.', doc.page.margins.left, doc.y);
         doc.moveDown(0.5);
      }

      // E. Retro-Commissioning Measures Recommended
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('E. Retrocommissioning Plan:', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('According to EBEWE guideline SEC. 91.9704., only “Base Building Systems” (BBS) are subject to the retrocomissioning study. The BBS are the systems and subsystems of a building that use or distribute energy and/or water and/or impact the energy and/or water consumption.', { align: 'left' });
      doc.moveDown()
      const proceed = [
         'Base building systems shall not include:',
         'Systems or subsystems owned by a tenant or for which a tenant bears full maintenance responsibility, that are within the tenant’s leased space and exclusively serve such leased space, and for which the tenant pays all the energy and water bills according to usage and demand as measured by a meter or sub-meter.',
         'Systems or subsystems owned by a residential unit owner that exclusively serve the residential unit of that owner.',
         'Systems or subsystems that operate industrial applications such as manufacturing.',
         'Where is not possible to include all major building systems and equipment as defined above, the largest energy using equipment as well as systems known for having problematic controls, or operational and comfort problems are selected'
      ];

      proceed.forEach(procedure => {
         doc.fontSize(10)
            .font('Helvetica')
            .text(`• ${procedure}`);

      });
      doc.moveDown();
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Where is not possible to include all major building systems and equipment as defined above, the largest energy using equipment as well as systems known for having problematic controls, or operational and comfort problems are selected', { align: 'left' });
      doc.moveDown()

      doc.moveDown();

      recommendations.filter((r: any) => r.status === 'recommended').forEach((rec: any) => {
         doc.fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(rec.name);
         doc.moveDown(0.5);

         doc.fontSize(10)
            .font('Helvetica')
            .text(rec.description);
         doc.moveDown(0.5);

         doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(`Estimated Annual Savings: ${this.formatNumber(rec.annualSavings)} kWh (${this.formatCurrency(rec.costSavings)})`);
         doc.moveDown(1);


         doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Supporting Images:');
         doc.moveDown(0.5);

         const imageWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 20) / 2;
         const imageHeight = 100;
         const imageMargin = 20;
         const imageYStart = doc.y;

         const imagePath = './public/images/placeholder.jpg'; // <- Adjust to your actual image path

         for (let i = 0; i < 2; i++) {
            const x = doc.page.margins.left + (i * (imageWidth + imageMargin));
            const y = imageYStart;

            try {
               doc.image(imagePath, x, y, { width: imageWidth, height: imageHeight });
            } catch (error) {
               // Fallback to placeholder if image fails
               doc.rect(x, y, imageWidth, imageHeight)
                  .fill('#f5f5f5')
                  .stroke('#cccccc');

               doc.fontSize(10)
                  .fillColor('#666666')
                  .text(`Image ${i + 1}`, x + imageWidth / 2 - 3, y + imageHeight / 2 - 5, { align: 'center' });
            }
         }

         doc.y = imageYStart + imageHeight + 15;
         doc.moveDown(0.5);


         // Move Y position below all image rows
         doc.y = imageYStart + imageHeight + 20;
         doc.moveDown(0.5);

      });
      doc.moveDown(0.5);

      // F. RCMs Already Implemented
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('G. Functional Performance Test Methodology', { align: 'left' });

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Vert conducted a site assessment to learn how the existing systems and equipment are operated and maintained. ', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Vert conducted a site assessment to learn how the existing systems and equipment are operated and maintained. During the site visit the RCx agent conducted an in-depth site survey of equipment condition, interviewed building staff regarding operating strategies and discussed significant issues related to equipment and operations. Based on the site assessment the agent utilized one or more of the Functional Performance Test methods listed below to assess the performance of a representative sample of different building systems. ', { align: 'left' });
      doc.moveDown();

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica-Bold')
         .text('a. Stand-Alone Portable Data Loggers', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Data loggers provide valuable information on building-system behavior that may not be available from the building-automation system (BAS) or where a BAS does not exist. They can also be used to confirm operation of the BAS itself as sensors or actuators may not be accurate or functional. See Appendix xx for list of systems where data loggers were deployed.', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica-Bold')
         .text('b. BAS Trend Data', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Vert provides a detailed request for required trend logs from the building Engineer / Management or from the Controls Vendor, who executes the trends and provides the data to Vert in .CSV format. See Appendix xx for Trend Log request.', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica-Bold')
         .text('c. System & Equipment Tests', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Agent conducts tests on selected systems and equipment with the assistance of  facility staff and Controls Vendor as required.  The tests comprised of changing parameters, set points or conditions, and observing and documenting the actual system or equipment response through various modes and conditions (both simulated and real).Refer to appendix XX for the test sheets.', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica-Bold')
         .text('d. Spot Measurements', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Spot measurements of temperature, air quality, pressure, flow, or other parameters may be sufficient for some types of equipment or systems. Typically, spot measurements are used for systems where trend logging is not available and where portable data logger application is impractical. Refer to appendix XX for the test sheets.', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica-Bold')
         .text('e. Observation', { align: 'left' });
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('During the site survey the Agent performs a System Condition Analyses on facility equipment to assess its current operational and maintenance conditions.  The goal of this activities is the identification of O&M issues or physical conditions affecting the performance of equipment and systems, based on direct observation. Typical items to be checked include:', { align: 'left' });
      doc.moveDown(0.2);

      const proced2 = [
         'Cleanliness of coils, louvers, and other surfaces',
         'Serviceability of filters, belts, valves, dampers, ducts, flex connections, insulation, door seals and glazing',
         'Completion of required preventative maintenance actions',
         'Overall equipment physical condition'
      ]
      proced2.forEach(procedure => {
         doc.fontSize(10)
            .font('Helvetica')
            .text(`• ${procedure}`);
      });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Collected data is analyzed.  Mechanical and Electrical equipment, systems and control sequences are compared to the original design intent.  Issues and potential improvements are identified and documented.  Energy calculations are performed for capital cost measures that appear to have the most impact on comfort, energy, or indoor air quality.  Implementation costs for the measures are estimated, and results are presented in the following sections of this report.', { align: 'left' });
      doc.moveDown();

      recommendations.filter((r: any) => r.status === 'implemented').forEach((rec: any) => {
         doc.fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(rec.name);

         doc.fontSize(10)
            .font('Helvetica')
            .text(rec.description);
         doc.moveDown(0.5);

         doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(`Annual Savings: ${this.formatNumber(rec.annualSavings)} kWh (${this.formatCurrency(rec.costSavings)})`);
         doc.moveDown(1);
      });

      // G. Assessment Team
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('H. Assessment Team:', { align: 'left' });

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
      doc.font('Helvetica')
         .text('The Assessment Team consists of ', { continued: true });
      doc.font('Helvetica-Bold')
         .text('David Ellner, P.E./ Dr William Shoard, P.E., ', { continued: true });
      doc.font('Helvetica')
         .text('and Vert’s VP of Engineering, Younes Amermouch. Additional engineering efforts are supported by Sam Rios, Ryan Hillis, and Maya Witenberg acting as Energy Efficiency Engineers and/or Field Auditors.', { align: 'left' });


      // Table: Assessment Team Roles
      const assessmentTeamTableTop = doc.y; // start from current y position
      const rowHeight = 25;
      const columnWidth = [120, 200, 120];

      const assessmentTeamData = [
         ['Role', 'Name', 'Company'],
         ['Chief Engineer', 'David Ellner, P.E./ Dr William Shoard, P.E.', 'Vert Energy Group'],
         ['Project Supervisor', 'Younes Amermouch', 'Vert Energy Group'],
         ['Project Manager', 'Elize Torres', 'Vert Energy Group'],
         ['Auditor/RCx Agent', 'Sam Rios', 'Vert Energy Group'],
         ['Auditor/RCx Agent', 'Ryan Hillis', 'Vert Energy Group'],
         ['Administrative Assistant', 'Jill Jones', 'Vert Energy Group'],
         ['Auditor/RCx Agent', 'Maya Witenberg', 'Vert Energy Group'],
         ['Management', '0', '0'],
         ['Management', '0', '0'],
         ['Management', '0', '0']
      ];

      // Draw header background
      doc.rect(50, assessmentTeamTableTop, columnWidth.reduce((a, b) => a + b, 0), rowHeight)
         .fill('#8CC63F');

      // Draw table cells
      assessmentTeamData.forEach((row, rowIndex) => {
         const y = assessmentTeamTableTop + rowIndex * rowHeight;

         row.forEach((cellText, colIndex) => {
            const x = 50 + columnWidth.slice(0, colIndex).reduce((a, b) => a + b, 0);

            // Draw cell border
            doc.rect(x, y, columnWidth[colIndex], rowHeight).stroke();

            // Text styling
            if (rowIndex === 0) {
               doc.font('Helvetica-Bold').fillColor('#000');
            } else if (rowIndex === 1 && colIndex === 1) {
               // Highlight 1st name row
               const highlight = '#ffff00';
               const textWidth = doc.widthOfString(cellText);
               const textHeight = doc.currentLineHeight();

               doc.rect(x + 2, y + 5, textWidth + 2, textHeight).fill(highlight);
               doc.fillColor('#000').font('Helvetica-Bold')
                  .text(cellText, x + 2, y + 5, { width: columnWidth[colIndex] - 4 });
               return;
            } else {
               doc.font('Helvetica').fillColor('#000');
            }

            doc.text(cellText, x + 5, y + 7, {
               width: columnWidth[colIndex] - 10
            });
         });
      });

      doc.moveDown(0.5); // Spacing after table

      doc.x = doc.page.margins.left;
      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('This study was facilitated by the efforts of Project Manager Elize Torres and Administrative Assistant Jill Jones from Vert Energy Group.', { align: 'left' });
      doc.font('Helvetica')

      doc.moveDown();

      this.renderRecommendedMeasures(doc, measures);
      doc.moveDown(0.5);




      //   D
      this.renderSectionHeader(doc, 'C. Energy Conservation Measures Summary Table:', sectionGrey);
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('The following table summarizes the energy conservation measures identified for this project, including estimated savings and financial metrics.', { align: 'left' });
      doc.moveDown(0.5);

      this.renderMeasuresTable(doc, measures);
      doc.moveDown(0.5);

      // H. Project Team
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('H. Project Team:', { align: 'left' });
      doc.moveDown();

      // Calculate available width based on page margins
      const teamAvailableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10;

      // Distribute column widths proportionally
      const teamColumnWidths = [
         Math.floor(teamAvailableWidth * 0.30), // Name (30%)
         Math.floor(teamAvailableWidth * 0.40), // Role (40%)
         Math.floor(teamAvailableWidth * 0.30)  // Organization (30%)
      ];

      const teamHeaderCells = ['Name', 'Role', 'Organization'];
      const teamTableWidth = teamColumnWidths.reduce((a, b) => a + b, 0);

      // Prepare team data rows
      let teamData: string[][] = [];
      if (teamMembers && Array.isArray(teamMembers)) {
         teamData = teamMembers.map((member: any) => [
            member.name || '',
            member.role || '',
            member.organization || ''
         ]);
      }

      // Render the table using the enhanced addSimpleTable method
      this.addSimpleTable(
         doc,
         teamHeaderCells,
         teamData.length > 0 ? teamData : [['No team members information available', '', '']],
         teamTableWidth,
         {
            columnWidths: teamColumnWidths,
            columnAlignments: ['left', 'left', 'left'],
            headerBgColor: '#e6f2e6',
            headerTextColor: sectionGrey,
            zebra: true,
            zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
            headerHeight: 30,
            rowHeight: 25,
            fontSize: { header: 10, body: 10 }
         }
      );
      doc.moveDown(2);


      // I. Site Visit Information
      doc.moveDown(2);
      doc.x = doc.page.margins.left;
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('I. Site Visit Information:', { align: 'left' });
      doc.moveDown();

      doc.fontSize(12)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Date of site visit #1:');
      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .text((projectData && projectData.siteVisitDate) ? projectData.siteVisitDate : '[Date not available]');
      doc.moveDown(2);

      // k. Operational Training. 
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('K. Operational Training', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('Operational training of Section 91.9706.1.3 of the LAMC was not necessary for this building due to one or more of the following reasons:', { align: 'left' });
      doc.moveDown(0.5);

      const proced3 = [
         'The building engineer is already well trained in these matters.',
         'The building does not have a dedicated building engineer responsible for day-to-day operations.',
         'Repairs and maintenance are conducted by third party vendors.',
         'There were no significant findings that require a formal training.'
      ]

      proced3.forEach(procedure => {
         doc.fontSize(10)
            .font('Helvetica')
            .fillColor('black')
            .text(`• ${procedure}`);
      });

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('However, Vert’s engineer has discussed with the person in charge of the building about the operation and maintenance issues observed, and how to correct them. Many of these remarks involved general maintenance, scheduling, and control strategies. ', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('These observations are included in the retrocommissioning report (RCMs) and were discussed during the report presentation. ', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('These observations are included in the retrocommissioning report (RCMs) and were discussed during the report presentation. ', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('perational training of Section 91.9706.1.3 of the LAMC was conducted and include the following: suggested documents and updates to the building system operation manual.  ', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('black')
         .font('Helvetica')
         .text('This Energy Audit, Water Audit and Retrocomissioning study, which include: ', { align: 'left' });
      doc.moveDown(0.5);

      const proced4 = [
         'Narrative of all systems investigated, a brief description of the system, its purpose and general operation, and operational factors that impact energy and water usage.',
         'A description of and rationale for all recommended measures, including proposed changes to automatic and manual control strategies, noting special operating and maintenance limitations.',
         'Occupancy schedules, temperature, humidity, and ventilation requirements for different spaces, and identification of the mechanical systems which serve them. ',
         'List of points of the facility Supervisors, Managers as well as List of Vendors. Refer to appendix XX ',
         'Recommendations for equipment maintenance frequency Refer to appendix XX'
      ]

      proced4.forEach(procedure => {
         doc.fontSize(10)
            .font('Helvetica')
            .fillColor('black')
            .text(`• ${procedure}`);
      });
      doc.moveDown();

      // J. Implementation Plan
      doc.fontSize(14)
         .fillColor(sectionGrey)
         .font('Helvetica-Bold')
         .text('J. Implementation Plan:', { align: 'left' });
      doc.moveDown();

      const phases = [
         {
            title: 'Phase 1: Assessment and Planning',
            duration: '2-4 weeks',
            tasks: [
               'Detailed system analysis',
               'Documentation review',
               'Baseline performance testing'
            ]
         },
         {
            title: 'Phase 2: Implementation',
            duration: '4-8 weeks',
            tasks: [
               'System adjustments and repairs',
               'Control sequence optimization',
               'Staff training'
            ]
         },
         {
            title: 'Phase 3: Verification',
            duration: '2-4 weeks',
            tasks: [
               'Post-implementation testing',
               'Performance verification',
               'Documentation updates'
            ]
         }
      ];

      phases.forEach(phase => {
         doc.fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(phase.title);
         doc.moveDown(0.5);

         doc.fontSize(10)
            .font('Helvetica')
            .text(`Duration: ${phase.duration}`);
         doc.moveDown(0.5);

         phase.tasks.forEach(task => {
            doc.fontSize(10)
               .text(`• ${task}`);
         });
         doc.moveDown(0.5);
      });



      // Add a page break after the section
      doc.addPage();
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

   private renderRecommendedMeasures(doc: typeof PDFDocument, measures: any[]): void {
      // Section header - force left alignment
      doc.x = doc.page.margins.left;
      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('I. Energy Efficiency Measures Recommended', { align: 'left' });
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
      doc.moveDown(0.5);

      // Path to assets folder
      const assetsPath = path.join(__dirname, '../../../../assets');

      doc.fontSize(12)
         .fillColor('#4A4A4A')
         .font('Helvetica-Bold')
         .text('J. Functional Performance Test Findings & Recommendations', { align: 'left' });
      doc.moveDown(0.5);

      // Create sample measures if none exist
      const measuresToRender = measures?.filter(m => m.status === 'recommended') || [];
      const sampleMeasures = Array(5).fill(null).map((_, i) => ({
         title: `RCM ${i + 1}: xxxxxxxxxxxx`,
         'Existing Condition': "xxxxxxxxxxxx",
         Recommendation: "xxxxxxxxxxxx",
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
         doc.moveDown(0.5);

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
         doc.moveDown(0.5);
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
}