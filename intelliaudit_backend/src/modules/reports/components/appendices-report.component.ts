import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { BaseReportComponent } from './base-report.component';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AppendicesReportComponent extends BaseReportComponent {
    /**
     * Renders the appendices section of the report
     * @param doc PDFKit document
     * @param data Object containing appendices data
     */
    render(doc: typeof PDFDocument, _data: any): void {
        this.resetPageLayout(doc);

        const brandGreen = '#4d9b58';

        doc.fontSize(18)
            .fillColor(brandGreen)
            .font('Helvetica-Bold')
            .text('V.    Appendices', { align: 'left' });
        doc.moveDown();

        this.renderAssumptionsSection(doc);
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        this.renderEquationsSection(doc);
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        this.renderSupportingDocuments(doc);
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        this.renderEquivalentFullLoadHoursTable(doc);
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        doc.moveDown(1);
        this.imagePlaceHolder(doc)

    }

    private renderAssumptionsSection(doc: typeof PDFDocument): void {
        const sectionGrey = '#4A4A4A';
        const lineHeight = 15;
        const bulletIndent = 20;

        // Section header
        doc.fontSize(12)
            .fillColor(sectionGrey)
            .font('Helvetica-Bold')
            .text('A.  Assumptions', { align: 'left' });
        doc.moveDown(0.5);

        // Introductory paragraph
        doc.fontSize(10)
            .fillColor('black')
            .font('Helvetica')
            .text('The assumptions utilized in this energy audit include but are not limited to following:');
        doc.moveDown(1);

        // Assumption items
        const assumptions = [
            {
                letter: 'A',
                text: 'Cost Estimates noted within this report are based on industry accepted costing data such as RSA 2020/2014 Cost Data, contractor pricing and engineering estimates. All cost estimates for this level of auditing are +/- 20%. The cost estimates indicated within this audit should be utilized by the owner for providing further project development points energy audit. Project development would include investment grade auditing and detailed engineering.'
            },
            {
                letter: 'B',
                text: 'Energy savings noted within this audit are calculated utilizing industry standard procedures and accepted engineering assumptions. For this level of auditing, energy savings are not guaranteed.'
            },
            {
                letter: 'C',
                text: 'Information gathering for each facility is strongly based on interviews with operations personnel. Information dependent on verbal feedback is used for calculation assumptions including but not limited to the following:',
                bullets: [
                    'operating hours',
                    'equipment type',
                    'control strategies',
                    'scheduling'
                ]
            },
            {
                letter: 'D',
                text: 'Information contained within the major equipment list is based on the existing owner documentation where available (drawing, O&M manuals, etc.) if existing owner documentation is not available, catalog information is utilized to populate the required information.'
            },
            {
                letter: 'E',
                text: 'Equipment incentives and energy credits are based on current pricing and status of rebate programs. Related availability is dependent on the individual program funding and applicability.'
            },
            {
                letter: 'F',
                text: 'Equipment (SVSC, Plumbing, Electrical, & Lighting) noted within the energy and water saving measures recommendations is strictly noted as a basis for calculation of energy savings. The owner should use this equipment information as a benchmark when pursuing further investment grade project development and detailed engineering for specific energy conservation measures.'
            },
            {
                letter: 'G',
                text: 'Utility bill annual averages are utilized for calculation of all energy costs unless otherwise noted. Accuracy of the utility energy usage and costs are based on the information provided. Utility information including usage and costs is estimated where incomplete data is provided.'
            }
        ];

        // Render each assumption with page break checks
        assumptions.forEach((assumption, _index) => {
            // Check if we need a new page before rendering each assumption
            const requiredHeight = this.calculateAssumptionHeight(doc, assumption);
            if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                this.resetPageLayout(doc);
            }

            // Render assumption letter and text
            doc.fontSize(10)
                .fillColor('black')
                .font('Helvetica-Bold')
                .text(`${assumption.letter}.`, { continued: true, indent: 0 })
                .font('Helvetica')
                .text(` ${assumption.text}`);

            // Render bullets if they exist
            if (assumption.bullets) {
                assumption.bullets.forEach((bullet: any, _bulletIndex: any) => {
                    // Check space for each bullet point
                    if (doc.y + lineHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        this.resetPageLayout(doc);
                    }

                    doc.fontSize(10)
                        .fillColor('black')
                        .font('Helvetica')
                        .text(`• ${bullet}`, { indent: bulletIndent });
                });
            }

            doc.moveDown(0.5);
        });

        doc.moveDown(1);

        // Render the utility rates table with page check
        if (doc.y + 150 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            this.resetPageLayout(doc);
        }
        this.renderUtilityRatesTable(doc);
    }

    private calculateAssumptionHeight(_doc: typeof PDFDocument, assumption: any): number {
        const lineHeight = 15;
        const bulletHeight = 15;
        let height = lineHeight * 2; // Base height for assumption text

        if (assumption.bullets) {
            height += assumption.bullets.length * bulletHeight;
        }

        return height;
    }


    private renderUtilityRatesTable(doc: typeof PDFDocument): void {
        const tableWidth = 300;
        const columnWidths = [30, 170, 100]; // Adjust as needed

        // Table data
        const tableData = [
            ['B', 'Blended KWh Rate:', 'RDW/QJ'],
            ['Z', 'Blended Therm rate:', 'RDW/QJ'],
            ['S', 'Blended Loss Scenarios:', '50.03'],
            ['M', 'Water & Sewer Cost per gallon:', '50.10']
        ];

        // Render the table
        this.addSimpleTable(
            doc,
            ['', '', ''], // Empty headers
            tableData,
            tableWidth,
            {
                columnWidths: columnWidths,
                columnAlignments: ['left', 'left', 'right'],
                headerBgColor: '#ffffff',
                headerTextColor: '#000000',
                zebra: false,
                fontSize: { header: 10, body: 10 },
                // Removed unsupported property
            }
        );
    }

    private renderEquationsSection(doc: typeof PDFDocument): void {
        const sectionGrey = '#4A4A4A';
        const lineHeight = 14;
        const bulletIndent = 20;
        const subBulletIndent = 40;

        // Section header
        doc.fontSize(12)
            .fillColor(sectionGrey)
            .font('Helvetica-Bold')
            .text('B. Equations:', { align: 'left' });
        doc.moveDown(0.5);

        // First decorative bullet
        doc.fontSize(10)
            .fillColor('black')
            .font('Helvetica')
            .text('• 360°=∞= 360°=∞= 360°=∞=', { indent: bulletIndent });
        doc.moveDown(1);

        // Lighting equations
        const equations = [
            {
                text: 'Lighting Upgrade kWh Saving = [L Fixtures (L Lamps / Fixture) - (1/1000)W] (Vipre – Vipost) [It\'s operating]'
            },
            {
                text: 'Lighting Control Upgrade kWh Saving = [L Fixtures (L Lamps / Fixture) - (1/1000)W] (Vipre + It\'s pre) – (Vipost + it)'
            },
            {
                text: 'Average Demand 60% = 2 (Coding Capacity 68%/m) (SEER)'
            },
            {
                text: 'Annual Energy Use (kWh) = 50% of year after full load annual hours'
            },
            {
                text: 'Motor Draw (kWh) = (Ptg) 0.746 kWh (p(tg),loaded) has a yield recovery'
            },
            {
                text: 'Corotation (BMI) = 0.4x40x10(mean as Ptg) (Joint)'
            },
            {
                text: 'Ventilation / Infiltration (BMI) = (1.08%) (SEM) (Joint) Joint'
            },
            {
                category: 'Efficiency Conversions',
                items: [
                    'kWh/m = 12 / SEER',
                    'COP = SEER / 3.412',
                    'COP = 3.312 / (kWh/m)'
                ]
            },
            {
                category: 'Heat Transfer in Water',
                items: [
                    'Capacity (SEER) = SEER * SE / 2'
                ]
            },
            {
                category: 'Power from TIP',
                items: [
                    'Power (kW) = 0.748 * Power (hp)'
                ]
            },
            {
                category: 'Pump power',
                items: [
                    'XXXXXXXXX (Ptg) = (Full heat) * (SEER) / 3900',
                    'Pump Power = XXXXXXXXX / (Pump off * Motor off)'
                ]
            }
        ];

        // Render equations with proper formatting
        equations.forEach((eq) => {
            // Check page space before rendering each equation
            if (doc.y + lineHeight * 3 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                this.resetPageLayout(doc);
            }

            if (eq.text) {
                // Simple equation
                doc.fontSize(10)
                    .fillColor('black')
                    .font('Helvetica')
                    .text(`• ${eq.text}`, { indent: bulletIndent });
                doc.moveDown(0.5);
            } else if (eq.category && eq.items) {
                // Category with sub-items
                doc.fontSize(10)
                    .fillColor('black')
                    .font('Helvetica-Bold')
                    .text(`• ${eq.category}`, { indent: bulletIndent });
                doc.moveDown(0.3);

                eq.items.forEach((item) => {
                    if (doc.y + lineHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        this.resetPageLayout(doc);
                    }

                    doc.fontSize(10)
                        .fillColor('black')
                        .font('Helvetica')
                        .text(`  ◦ ${item}`, { indent: subBulletIndent });
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.5);
            }
        });

        // Final building equations
        doc.moveDown(1);
        doc.fontSize(10)
            .fillColor('black')
            .font('Helvetica-Bold')
            .text('Building Site EUT = [Start to Usage e: BBT U + Gas Usage e: BBT U]');
        doc.fontSize(10)
            .fillColor('black')
            .font('Helvetica-Bold')
            .text('Building Square Footage');
    }

    private renderSupportingDocuments(doc: typeof PDFDocument): void {
        const sectionGrey = '#4A4A4A';
        const tableMargin = 20;

        // Section header
        doc.x = doc.page.margins.left;
        doc.fontSize(12)
            .fillColor(sectionGrey)
            .font('Helvetica-Bold')
            .text('C. Supporting Documents', { align: 'left' });
        doc.moveDown(1);

        // Equipment List header
        doc.x = doc.page.margins.left;
        doc.fontSize(11)
            .fillColor('black')
            .font('Helvetica-Bold')
            .text('1. Equipment List');
        doc.moveDown(0.5);

        // Define equipment categories
        const equipmentCategories = [
            {
                letter: 'a.',
                name: 'HVAC',
                headers: ['Equipment Description', '# of Units', 'Equipment Location', 'Age', 'Manufacturer & Model', 'Capacity'],
                rows: [] // Empty rows for placeholder
            },
            {
                letter: 'b.',
                name: 'Lighting',
                headers: ['Blast', 'Location', '# Resource', '# LaunchSize', 'Total Launch', 'Lamp Type', 'Lamp W.s.h.'],
                rows: []
            },
            {
                letter: 'c.',
                name: 'Plumbing',
                headers: ['Blazards', '', 'Average Floor', 'Quantity'],
                rows: []
            },
            {
                letter: 'd.',
                name: 'Domestic Hot Water (DHW)',
                headers: ['Equipment Description', '# of Units', 'Equipment Location', 'Age', 'Manufacturer & Model', 'Speed', 'Efficiency'],
                rows: []
            },
        ];

        // Render each equipment category
        equipmentCategories.forEach(category => {
            // Check page space before rendering each category
            if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                this.resetPageLayout(doc);
            }

            // Category header
            doc.x = doc.page.margins.left;
            doc.fontSize(10)
                .fillColor('black')
                .font('Helvetica-Bold')
                .text(`${category.letter} ${category.name}`);
            doc.moveDown(0.5);

            // Only render table if headers exist
            if (category.headers.length > 0) {
                // Calculate column widths (equal distribution)
                const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - tableMargin;
                const colWidth = tableWidth / category.headers.length;

                // Create empty table data - ONLY BODY ROWS (headers are passed separately)
                const tableData = Array(2).fill(null).map(() =>
                    Array(category.headers.length).fill('')
                );

                // Render table - headers passed separately from body data
                this.addSimpleTable(
                    doc,
                    category.headers, // Headers array
                    tableData,        // Body data (2 empty rows)
                    tableWidth,
                    {
                        columnWidths: category.headers.map(() => colWidth),
                        columnAlignments: Array(category.headers.length).fill('left'),
                        headerBgColor: '#f0f0f0',
                        headerTextColor: '#000000',
                        zebra: true,
                        zebraColors: { even: '#ffffff', odd: '#f9f9f9' },
                        fontSize: { header: 9, body: 9 }
                    }
                );
            }

            doc.moveDown(1);
            const additionalDocuments = [
                {
                    number: '2.',
                    name: 'Functional Test Sheets',
                    instruction: '(Copy and paste: Keep Source Formatting (KF))'
                },
                {
                    number: '3.',
                    name: 'Building drawings',
                    instruction: '(Copy and paste as a Picture)'
                },
                {
                    number: '4.',
                    name: 'Equipment Literature',
                    instruction: '(Copy and paste as a Picture)'
                },
                {
                    number: '5.',
                    name: 'Other',
                    instruction: ''
                }
            ];

            // Render additional documents
            additionalDocuments.forEach(docItem => {
                // Check page space
                if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                    this.resetPageLayout(doc);
                }

                doc.x = doc.page.margins.left;
                doc.fontSize(10)
                    .fillColor('black')
                    .font('Helvetica-Bold')
                    .text(`${docItem.number} ${docItem.name}`, { continued: true })
                    .font('Helvetica')
                    .text(` ${docItem.instruction}`);
                doc.moveDown(0.5);
            });
        });
    }


    private renderEquivalentFullLoadHoursTable(doc: typeof PDFDocument): void {
        const sectionGrey = '#4A4A4A';
        const tableWidth = 540; // Fixed total width
        const tableX = (doc.page.width - tableWidth) / 2;
        const columnWidth = tableWidth / 3;
        const columnSubWidth = columnWidth / 2;
        const rowHeight = 18;
        const tableHeight = 700;

        if (doc.y + tableHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            doc.y = doc.page.margins.top;
        }

        doc.fontSize(12).fillColor(sectionGrey).font('Helvetica-Bold').text('D. Equivalent Full Load Hours (EFLH)', { align: 'left' });
        doc.moveDown(0.5);

        doc.rect(tableX, doc.y, tableWidth, tableHeight - 60).lineWidth(1).stroke('#000000');

        doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Equivalent Full Load Cooling and Heating Hours', tableX, doc.y + 10, {
                align: 'center',
                width: tableWidth,
            });

        const explanatoryText = 'Values on low end of range assume units off during unoccupied hours in cooling season and 19°F set back during winter. Values on high end assume no set back control. Unoccupied periods vary by building type.';
        doc.fontSize(7)
            .font('Helvetica')
            .text(explanatoryText, tableX + 10, doc.y + 22, {
                align: 'center',
                width: tableWidth - 20,
            });

        const headerLine1Y = doc.y + 37;
        doc.moveTo(tableX, headerLine1Y).lineTo(tableX + tableWidth, headerLine1Y).stroke();

        const buildingTypes = ['Nine Month Schools', 'Office - 5 to 7 Day Week', 'Retail - 8 to 10+ Seven Days'];
        const hoursRanges = ['1100 - 1760', '2200 - 2940', '3300 - 3940'];

        buildingTypes.forEach((type, i) => {
            const xPos = tableX + columnWidth * i;
            if (i > 0) {
                doc.moveTo(xPos, headerLine1Y).lineTo(xPos, headerLine1Y + 45).stroke();
            }

            doc.fontSize(8)
                .font('Helvetica-Bold')
                .text(type, xPos, headerLine1Y + 5, { align: 'center', width: columnWidth });

            doc.font('Helvetica')
                .text(hoursRanges[i], xPos, headerLine1Y + 20, { align: 'center', width: columnWidth });

            doc.font('Helvetica-Bold')
                .text('Cooling', xPos, headerLine1Y + 35, {
                    align: 'center',
                    width: columnSubWidth,
                })
                .text('Heating', xPos + columnSubWidth, headerLine1Y + 35, {
                    align: 'center',
                    width: columnSubWidth,
                });

            // Middle divider between Cooling and Heating
            if (i < buildingTypes.length) {
                const dividerX = xPos + columnSubWidth;
                doc.moveTo(dividerX, headerLine1Y + 30).lineTo(dividerX, headerLine1Y + 45).stroke();
            }
        });

        const headerEndY = headerLine1Y + 45;
        doc.moveTo(tableX, headerEndY).lineTo(tableX + tableWidth, headerEndY).stroke();

        doc.fontSize(8).font('Helvetica-Bold').text('Annual Hours', tableX + 5, headerEndY + 5);

        buildingTypes.forEach((_, i) => {
            const typeX = tableX + columnWidth * i;
            doc.text('Cooling', typeX, headerEndY + 5, { align: 'center', width: columnSubWidth });
            doc.text('Heating', typeX + columnSubWidth, headerEndY + 5, { align: 'center', width: columnSubWidth });
        });

        let rowY = headerEndY + rowHeight;

        const cityData = [
            { city: 'Atlanta', values: ['420-650', '320-400', '650-1100', '720-800', '1150-1600', '950-1350'] },
            { city: 'Baltimore', values: ['415-610', '330-400', '600-1080', '720-890', '880-1485', '970-770'] },
            { city: 'Bismarck', values: ['240-400', '600-900', '550-740', '1200-1600', '740-780', '1650-2100'] },
            { city: 'Charleston, WV', values: ['420-570', '310-440', '620-1140', '770-840', '825-1600', '850-710'] },
            { city: 'Charlotte', values: ['560-800', '200-320', '940-1340', '510-740', '1300-1840', '600-850'] },
            { city: 'Chicago', values: ['380-600', '330-400', '620-950', '1300-1700', '710-1200', '1850-2400'] },
            { city: 'Dallas', values: ['650-890', '170-250', '1100-1700', '540-530', '1840-2760', '580-440'] },
            { city: 'Denver', values: ['430-650', '400-480', '700-930', '970-1030', '1200-1350', '1050-900'] },
            { city: 'Fairbanks, AK', values: ['35-70', '560-870', '60-700', '1650-1170', '110-370', '9770-10600'] },
            { city: 'Great Falls, MT', values: ['210-350', '350-440', '400-600', '1040-1080', '540-650', '1580-1900'] },
            { city: 'Houston', values: ['670-1000', '90-150', '1240-1770', '250-330', '1900-2450', '350-300'] },
            { city: 'Indianapolis', values: ['400-650', '350-480', '650-1280', '840-1040', '850-1680', '1230-1500'] },
            { city: 'Las Vegas', values: ['810-1100', '210-240', '1700-2400', '570-600', '2600-3400', '670-600'] },
            { city: 'Louisville', values: ['470-670', '260-410', '770-1750', '710-830', '1000-1770', '570-770'] },
            { city: 'Madison', values: ['305-470', '490-643', '550-850', '840-900', '845-900', '1550-2070'] },
            { city: 'Memphis', values: ['580-840', '170-240', '990-1700', '420-500', '1250-1780', '580-510'] },
            { city: 'Miami', values: ['950-1300', '55-80', '1550-2150', '80-65', '2150-3000', '61-60'] },
            { city: 'Minneapolis', values: ['310-550', '470-700', '600-930', '950-1240', '930-1710', '1740-2270'] },
            { city: 'Montgomery', values: ['610-910', '120-180', '1000-1710', '370-470', '1300-1990', '250-400'] },
            { city: 'Nashville', values: ['520-740', '250-370', '850-1380', '610-670', '1030-1710', '670-590'] },
            { city: 'New Orleans', values: ['710-980', '100-130', '1330-1920', '180-230', '1780-2420', '250-250'] },
            { city: 'New York', values: ['380-550', '150-440', '540-1060', '750-870', '750-2480', '650-760'] },
            { city: 'Omaha', values: ['370-440', '330-400', '460-820', '770-800', '810-1170', '900-770'] },
            { city: 'Phoenix', values: ['1000-1400', '70-90', '1700-2800', '190-200', '2750-3900', '200-180'] },
        ];

        cityData.forEach((row, index) => {
            const isEven = index % 2 === 0;

            if (isEven) {
                doc.rect(tableX + 1, rowY - 1, tableWidth - 2, rowHeight).fill('#f9f9f9');
            }

            doc.fontSize(8).fillColor('#000000').font('Helvetica').text(row.city, tableX + 5, rowY + 4);

            row.values.forEach((value, j) => {
                const groupIndex = Math.floor(j / 2);
                const isHeating = j % 2 === 1;
                const groupX = tableX + columnWidth * groupIndex;
                const xPos = groupX + (isHeating ? columnSubWidth : 0);

                doc.text(value, xPos, rowY + 4, {
                    align: 'center',
                    width: columnSubWidth,
                });
            });

            rowY += rowHeight;
            doc.moveTo(tableX, rowY).lineTo(tableX + tableWidth, rowY).stroke();
        });

        doc.fontSize(7)
            .fillColor('#000000')
            .font('Helvetica-Oblique')
            .text('* Modified from: "Development of Equivalent Full Load Heating and Cooling Hours for GCHPs applied to Various Locations throughout the U.S." - Final Report, RP-1120, ASHRAE, Sept. 2001',
                tableX, rowY + 10, { width: tableWidth });

        doc.y = rowY + 30;
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        this.renderAdditionalOMSection(doc);
        doc.moveDown(1);
        doc.x = doc.page.margins.left;
        this.renderLADWPRebatesSection(doc);
        doc.moveDown(1);
    }

    private renderAdditionalOMSection(doc: typeof PDFDocument): void {
        const sectionTitle = 'E. Additional O&M';
        const subheading = 'Suggested Basic Inspections & Record Keeping';
        const leftMargin = doc.page.margins.left;
        const bulletIndent = 15;
        const subBulletIndent = 25;

        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(12).text(sectionTitle);
        doc.moveDown(0.5);
        doc.fontSize(10).text(subheading, { underline: true });

        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9).text(`The basic inspections below are to make sure that the equipment and surrounding areas are clean, no unusual noises or visual damages detected that require immediate attention and that records are kept. 
The items listed do not require any technical skills and do not represent a maintenance program. The items address only the portion of the basic inspections related to the common area lighting, irrigation system, boiler, and HVAC units. It is not a comprehensive list for all locations, and it does not include the building safety inspections. Where applicable, all building mechanical, electrical and plumbing equipment should not duplicate or replace the operation and maintenance O&M of the building systems.`);

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('A. Record keeping:', { continued: false });
        const A_items = [
            'Equipment information: Keep all manufacturer’s instructions and manuals available in an accessible location.',
            'Maintain a log for all Equipment including all recommended preventive maintenance and service records. A copy of the work order, which confirms the performance of scheduled maintenance, the repair, or replacement of any parts, should be placed in file to establish a record of who performed the equipment service.'
        ];
        A_items.forEach(item => {
            doc.moveDown(0.25).font('Helvetica').text(`• ${item}`, leftMargin + bulletIndent);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('B. Create and follow a schedule', { continued: true })
            .font('Helvetica').text(' to make sure operations checks and cleaning procedures are performed with the recommended frequency (O&M conducted by O&M logs).');

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('C. Implement a routine walk-through', { continued: true })
            .font('Helvetica').text(' to visually inspect the following for cleanliness and unusual noises where applicable:');

        const C_items = [
            'Office lobby HVAC equipment',
            'Irrigation system heads',
            'Water runoffs',
            'Garage lighting equipment in garage, hallways, exterior and other outdoor areas for:',
            '• Burned bulbs or nonfunctional fixtures',
            '• Other common building lighting fixtures',
            '• Fixtures cleanliness'
        ];
        C_items.forEach((item, _i) => {
            const indent = item.startsWith('•') ? subBulletIndent : bulletIndent;
            doc.moveDown(0.25).font('Helvetica').text(`${item}`, leftMargin + indent);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('D. Implement a routine walk-through', { continued: true })
            .font('Helvetica').text(' to visually inspect the following for cleanliness and unusual noises (where applicable):');
        const D_items = [
            'Office lobby HVAC equipment'
        ];
        D_items.forEach(item => {
            doc.moveDown(0.25).font('Helvetica').text(`• ${item}`, leftMargin + bulletIndent);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('E. Implement a quarterly HVAC inspection', { continued: true })
            .font('Helvetica').text(' (to be conducted by your maintenance personnel):');
        const E_items = [
            'Correct filter sizes used',
            'Filters are clean',
            'Filters aren’t bent or torn',
            'HVAC belts condition',
            'HVAC lines have minimal line damage',
            'HVAC compressors are in good shape',
            'HVAC fan blade balance'
        ];
        E_items.forEach(item => {
            doc.moveDown(0.25).font('Helvetica').text(`• ${item}`, leftMargin + bulletIndent);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('F. Implement a routine boiler inspection', { continued: true })
            .font('Helvetica').text(' (to be conducted by your maintenance personnel):');
        const F_items = [
            'Insulation in place and not damaged'
        ];
        F_items.forEach(item => {
            doc.moveDown(0.25).font('Helvetica').text(`• ${item}`, leftMargin + bulletIndent);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('H. Implement inspection of Exhaust fans', { continued: true })
            .font('Helvetica').text(' (to be conducted by your maintenance personnel):');
        const H_items = [
            'Routine inspection of roof supply and exhaust fans'
        ];
        H_items.forEach(item => {
            doc.moveDown(0.25).font('Helvetica').text(`• ${item}`, leftMargin + bulletIndent);
        });

        doc.moveDown(1);
    }

    private renderLADWPRebatesSection(doc: typeof PDFDocument): void {
        const leftMargin = doc.page.margins.left;
        // Removed unused 'linkOptions' declaration

        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(12).text('B. LADWP Rebates');

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(10).text('LADWP AC Optimization Program');
        doc.moveDown(0.25);
        doc.font('Helvetica').fillColor('blue')
            .text('https://ladwpactuneup.com/', leftMargin, doc.y, {
                link: 'https://ladwpactuneup.com/',
                underline: true
            });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fillColor('black').text('Custom Performance Program:');
        doc.moveDown(0.25);
        doc.font('Helvetica').fillColor('blue')
            .text(
                'https://www.ladwp.com/ladwp/faces/ladwp/commercial/savemoney/customrebatesandprograms/custompgpr?_afrLoop=20874898914415770&_afrWindowMode=0&_afrWindowId=null#%40%3F_afrWindowId%3Dnull%26_afrLoop%3D20874898914415770%26_afrWindowMode%3D0%26_adf.ctrl-state%3D1tg4pest4q',
                { link: 'https://www.ladwp.com/ladwp/faces/ladwp/commercial/savemoney/customrebatesandprograms/custompgpr?_afrLoop=20874898914415770&_afrWindowMode=0&_afrWindowId=null#%40%3F_afrWindowId%3Dnull%26_afrLoop%3D20874898914415770%26_afrWindowMode%3D0%26_adf.ctrl-state%3D1tg4pest4q', underline: true }
            );

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fillColor('black').text('Water Conservation Measures:');
        doc.moveDown(0.25);
        doc.font('Helvetica').fillColor('blue')
            .text(
                'https://www.ladwp.com/ladwp/faces/wcnav.externalid/wc-waterconservationmeasures?_adf.ctrl-state=4kbwuk4u_4&_afrLoop=11823828413455225&_afrWindowMode=0&_afrWindowId=920nbi4t2z#%40%3F_afrWindowId%3D920nbi4t2z%26_afrLoop%3D11823828413455225%26_afrWindowMode%3D0%26_adf.ctrl-state%3D920nbi4t_54',
                { link: 'https://www.ladwp.com/ladwp/faces/wcnav.externalid/wc-waterconservationmeasures?_adf.ctrl-state=4kbwuk4u_4&_afrLoop=11823828413455225&_afrWindowMode=0&_afrWindowId=920nbi4t2z#%40%3F_afrWindowId%3D920nbi4t2z%26_afrLoop%3D11823828413455225%26_afrWindowMode%3D0%26_adf.ctrl-state%3D920nbi4t_54', underline: true }
            );

        doc.moveDown(1);
    }

    private imagePlaceHolder(doc: typeof PDFDocument): void {
        try {
            doc.addPage();
            doc.y = doc.page.margins.top;
            const imagePath = path.join(__dirname, '..', '..', '..', '..', 'assets', 'image1.png');
            const imageBuffer = fs.readFileSync(imagePath);

            // Calculate centered position
            const imageWidth = 400;
            const xPos = doc.page.margins.left + (doc.page.width - doc.page.margins.left - doc.page.margins.right - imageWidth) / 2;

            doc.moveDown(1);
            doc.image(imageBuffer, xPos, doc.y, { width: imageWidth });

            // Adjust vertical position after image
            doc.y += 250; // Adjust based on your image's aspect ratio
        } catch (error) {
            // Fallback text - similar to your logo fallback but styled for this context
            doc.moveDown(1)
                .fontSize(12)
                .fillColor('#4d9b58') // Using your brand green
                .font('Helvetica-Bold')
                .text('Next Steps Diagram', { align: 'center' })
                .moveDown(0.5)
                .fontSize(10)
                .fillColor('#666666') // Using your gray
                .text('Visual representation not available', { align: 'center' });
        }
    }


}