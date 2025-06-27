import PDFDocument from 'pdfkit';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { BaseReportComponent } from './base-report.component';

@Injectable()
export class ExecutiveSummaryComponent extends BaseReportComponent {
  render(doc: typeof PDFDocument, data: any): void {
    const { project, energySummary, totalCost, totalUsage } = data;

    doc.x = doc.page.margins.left;
    doc.y = 80;

    const brandGreen = '#4d9b58';

    doc.fontSize(18)
      .fillColor(brandGreen)
      .font('Helvetica-Bold')
      .text('I.   Executive Summary', { align: 'left' })
      .moveDown();

    const renderStyledText = (text: string, _isPlaceholder: boolean, options: any = {}) => {
      doc.fillColor('#000000')
        .font('Helvetica')
        .text(text, options);
    };

    const potentialSavings = this.formatCurrency((totalCost?.totalCost || 1000) * 0.2);
    const totalEnergyUse = this.formatNumber(totalUsage?.totalEnergyUsage || 0);
    const totalWaterUse = this.formatNumber(totalUsage?.waterUsage || 0);

    const recommendations = energySummary?.data?.recommendations || [];
    const recommendationsList = recommendations.length > 0
      ? recommendations.slice(0, 3).map((r: any) => r.title || r.description).join(', ')
      : 'lighting upgrades, HVAC optimization, and water conservation measures';

    const isAddressPlaceholder = !project?.property_address && !project?.building_address;
    const isSavingsPlaceholder = !totalCost?.totalCost;
    const isEnergyUsePlaceholder = !totalUsage?.totalEnergyUsage;
    const isWaterUsePlaceholder = !totalUsage?.waterUsage;

    doc.fillColor('#4A4A4A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('A. Introduction:', { align: 'left' })
      .moveDown(0.5);

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .lineGap(4);

    doc.text('This report presents the findings of an ASHRAE Level II Energy Audit, Water Audit, and Retro-commissioning (RCx) study conducted at ', { continued: true });
    renderStyledText((project?.property_address || project?.building_address || 'the property address').replace(/\.$/, ''), isAddressPlaceholder, { continued: true });
    doc.text('. The analysis identified potential annual savings of $', { continued: true });
    renderStyledText(potentialSavings, isSavingsPlaceholder, { continued: true });
    doc.text(' through the implementation of energy and water efficiency measures. The property currently has an annual energy consumption of ', { continued: true });
    renderStyledText(totalEnergyUse, isEnergyUsePlaceholder, { continued: true });
    doc.text(' kWh and water consumption of ', { continued: true });
    renderStyledText(totalWaterUse, isWaterUsePlaceholder, { continued: true });
    doc.text(' gallons. The recommended measures include ', { continued: true });
    renderStyledText(recommendationsList, false, { continued: false });
    doc.moveDown(1);

    const clientName = project?.company_name || project?.property_name || 'Client';
    const buildingAddress = project?.property_address || project?.building_address || 'Property Address';
    const constructionYear = project?.property_year_built || project?.year_built || 'N/A';
    const buildingType = project?.building_type || project?.building_use_type || 'commercial';
    const buildingDescription = project?.description || `${buildingType} building`;
    const squareFootage = project?.property_gross_floor_area || project?.square_footage || project?.building_sqft || 0;

    const secondaryAreaType = project?.building_info?.type ? `${project.building_info.type} common` : 'common';
    const secondaryAreaSqft = Math.round(squareFootage * 0.1);

    const unitCountType1 = project?.total_units || (project?.building_info?.total_units || 0);
    const unitType1 = project?.building_info?.unit_types?.[0]?.type || 'residential';
    const unitCountType2 = project?.building_info?.unit_types?.[1]?.count || 0;
    const unitType2 = project?.building_info?.unit_types?.[1]?.type || 'commercial';

    doc.text('At the request of ', { continued: true });
    renderStyledText(clientName, false, { continued: true });
    doc.text(', Vert Energy Group (VEG) performed ASHRAE Level II Energy Audit, Water Audit and a retro-commissioning (RCx) study of the base building systems at ', { continued: true });
    renderStyledText(buildingAddress, false, { continued: true });
    doc.text('. Built in ', { continued: true });
    renderStyledText(constructionYear, false, { continued: true });
    doc.text(', this ', { continued: true });
    renderStyledText(buildingType, false, { continued: true });
    doc.text(' building is comprised of ', { continued: true });
    renderStyledText(buildingDescription, false, { continued: true });
    doc.text('. The ', { continued: true });
    renderStyledText(buildingType, false, { continued: true });
    doc.text(' portion of this property has a gross floor area of ', { continued: true });
    renderStyledText(this.formatNumber(squareFootage), false, { continued: true });
    doc.text(' ft² and the ', { continued: true });
    renderStyledText(secondaryAreaType, false, { continued: true });
    doc.text(' area is approximately ', { continued: true });
    renderStyledText(this.formatNumber(secondaryAreaSqft), false, { continued: true });
    doc.text(' ft².', { continued: false });

    if (unitCountType1 > 0 && unitCountType2 > 0) {
      doc.text(' It has a total of ', { continued: true });
      renderStyledText(unitCountType1.toString(), false, { continued: true });
      doc.text(' ', { continued: true });
      renderStyledText(unitType1, false, { continued: true });
      doc.text(' and ', { continued: true });
      renderStyledText(unitCountType2.toString(), false, { continued: true });
      doc.text(' ', { continued: true });
      renderStyledText(unitType2, false, { continued: true });
      doc.text(' apartments.', { continued: false });
    } else if (unitCountType1 > 0) {
      doc.text(' It has a total of ', { continued: true });
      renderStyledText(unitCountType1.toString(), false, { continued: true });
      doc.text(' ', { continued: true });
      renderStyledText(unitType1, false, { continued: true });
      doc.text(' units.', { continued: false });
    }

    doc.moveDown();
    doc.text('The study is referred to as The Existing Buildings Energy and Water Efficiency (EBEWE) Program, was established by Los Angeles Municipal Code (LAMC) Division 97, Article 1, Chapter IX with the purpose of reducing energy and water consumption by building in the City of Los Angeles. The efficiency improvements (if implemented) will lower the use of energy, water, and greenhouse gas emissions citywide.');
    doc.moveDown(1);

    doc.fillColor('#000000')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('The Energy Efficiency Audit Scope of Work includes:', { align: 'left' });

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .lineGap(3);

    doc.text('1. Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.');
    doc.text('2. Summarize observations, existing conditions, necessities, and opportunities.');
    doc.text('3. Analyze energy use and ENERGY STAR® benchmarking.');
    doc.text('4. Identify and summarize Energy Efficiency Measures (EEMs) based on a 10-year ownership strategy.');
    doc.text('5. Prepare an Energy Management Plan to achieve the following objectives:');
    doc.text('a. Reduce energy usage and cost through equipment and control upgrades', { indent: 15 });
    doc.text('b. Improve energy performance.', { indent: 15 });
    doc.text('c. Reduce water usage and cost through equipment and control upgrades', { indent: 15 });
    doc.text('d. Reduce water usage and cost thru operation and maintenance', { indent: 15 });
    doc.moveDown(1);

    doc.fillColor('#000000')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('The Water Audit Scope of Work includes:', { align: 'left' });

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000');

    doc.text('1. Perform an on-site facility survey of existing water-using fixtures, equipment, systems, and processes, and interview the critical operations and maintenance personnel.');
    doc.text('2. Summarize observations, existing conditions, necessities, and opportunities.');
    doc.text('3. Analyze water use and water use intensity (WUI).');
    doc.text('4. Identify and summarize Water Efficiency Measures (WEMs) based on a 10-year ownership strategy.');
    doc.text('5. Prepare a Management Plan to achieve the following objectives:');
    doc.text('a. Reduce water usage and cost through equipment and control upgrades.', { indent: 15 });
    doc.text('b. Reduce water usage and cost through monitoring & repairs', { indent: 15 });
    doc.text('c. Reduce water usage and cost thru operation and maintenance', { indent: 15 });
    doc.moveDown(1);

    doc.fillColor('#000000')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('The Retrocomissioning (RCx) study Scope of Work included:', { align: 'left' });

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000');

    doc.text('1. Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.');
    doc.text('2. Summarize observations, necessities, and opportunities.');
    doc.text('3. Identify and summarize Retro-commissioning Measures (RCMs) to be implemented.');
    doc.text('4. Prepare a Retro-commissioning Plan to achieve the following objectives:');
    doc.text('a. Correct existing equipment and system problems and deficiencies', { indent: 15 });
    doc.text('b. Optimize the building systems via tune-up activities', { indent: 15 });
    doc.text('c. Improve operation and maintenance (O&M)', { indent: 15 });
    doc.text('d. Reduce maintenance costs and improve long-term equipment reliability', { indent: 15 });

    doc.moveDown(2);

    doc.fillColor('#4A4A4A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('B. Summary Tables:', { align: 'left' });

    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('[Number] (number) energy and water efficiency measures were analyzed and recommended. These measures have estimated annual savings of #DIV/0! with #DIV/0!-years payback if incentives are still applicable and awarded.:', { align: 'left' })
      .moveDown();

    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10;

    const summaryColumnWidths = [
      Math.floor(availableWidth * 0.50),
      Math.floor(availableWidth * 0.50)
    ];

    const summaryHeaderCells = ['Metric', 'Value'];
    const summaryTableWidth = summaryColumnWidths.reduce((a, b) => a + b, 0);

    const summaryData = [
      ['Total Building Area', `${this.formatNumber(squareFootage)} ft²`],
      ['Building Type', buildingType],
      ['Year Built', constructionYear],
      ['Annual Energy Usage', `${this.formatNumber(totalUsage?.totalEnergyUsage || 0)} kWh`],
      ['Annual Water Usage', `${this.formatNumber(totalUsage?.waterUsage || 0)} gallons`],
      ['Potential Annual Savings', potentialSavings]
    ];

    this.addSimpleTable(
      doc,
      summaryHeaderCells,
      summaryData,
      summaryTableWidth,
      {
        columnWidths: summaryColumnWidths,
        columnAlignments: ['left', 'right'],
        headerBgColor: '#e6f2e6',
        headerTextColor: '#4A4A4A',
        zebra: true,
        zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
        headerHeight: 30,
        rowHeight: 25,
        fontSize: { header: 10, body: 10 }
      }
    );

    doc.moveDown(3);
    doc.x = doc.page.margins.left;

    doc.fillColor('#4A4A4A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('C. EEMs Cost Savings Summary Table', { align: 'left' })
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('The following table summarizes overall performance of energy and water efficiency measures recommended as part of the Energy Management Plan.', { align: 'left' })
      .moveDown(1);


    const tableHeight = this.calculateEEMTableHeight(doc);
    const spaceRemaining = doc.page.height - doc.page.margins.bottom - doc.y;

    if (spaceRemaining < tableHeight) {
      doc.addPage();
      doc.x = doc.page.margins.left;
      doc.y = doc.page.margins.top;
    }

    this.addEEMTable(doc);

    doc.addPage(); // If needed for space

    doc.fillColor('#4A4A4A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('D. EEM, WEM & RCM Financial Analysis Summary', { align: 'left' })
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('The following table summarizes the analysis of key financial metrics for each energy, water & retrocommissioning saving measure.', { align: 'left' })
      .moveDown(1);

    this.addFinancialAnalysisSummary(doc);
    doc.moveDown(2);
    doc.x = doc.page.margins.left;

    // Add the next steps section
    this.addNextStepsSection(doc);
    doc.moveDown(2);
    doc.x = doc.page.margins.left;
  }


  private calculateEEMTableHeight(_doc: typeof PDFDocument): number {
    return 5 + 5 + (5 * 5) + 5 + 5;
  }
  private addEEMTable(doc: typeof PDFDocument): void {
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.y += 5;

    const columnWidths = [
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.14),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.10),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.08),
      Math.floor(availableWidth * 0.06)
    ];

    const headerCells = [
      'EEM #',
      'Descriptions',
      'Cost\nSavings',
      'KWH\nSavings',
      'KW\nSavings',
      'Therms\nSavings',
      'Lbs\nSteam\nSavings',
      'Gallons\nSavings',
      'Estimated\nProject\nCost',
      'Incentives',
      'Net\nCost',
      'Useful\nLife\n(Years)'
    ];

    const tableData = [];

    for (let i = 1; i <= 14; i++) {
      tableData.push([
        `EEM ${i}`,
        '',
        '#DIV/0!',
        '',
        '',
        '',
        '',
        '',
        '',
        '$0',
        '$0',
        ''
      ]);
    }

    tableData.push([
      'TOTAL',
      '',
      '#DIV/0!',
      '0',
      '0',
      '0',
      '0',
      '0',
      '$0',
      '$0',
      '$0',
      ''
    ]);

    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

    this.addSimpleTable(
      doc,
      headerCells,
      tableData,
      tableWidth,
      {
        columnWidths: columnWidths,
        columnAlignments: ['left', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
        headerBgColor: '#e6f2e6',
        headerTextColor: '#4A4A4A',
        zebra: true,
        zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
        headerHeight: 65,
        rowHeight: 32,
        fontSize: { header: 8, body: 8 }
      }
    );

    doc.y += 10;
    const footnoteText = '*Energy and cost savings resulting from EEM___ will be realized by tenants, but the landlord will benefit from reduced maintenance cost (parts and labor).';
    const footnoteWidth = tableWidth * 0.8;
    const footnoteHeight = 20;

    doc.x = doc.page.margins.left;
    doc.fillColor('#000000')
      .fontSize(9)
      .font('Helvetica')
      .text(footnoteText, doc.x + 5, doc.y + 5, { width: footnoteWidth - 10 });

    doc.y += footnoteHeight + 10;
  }
  private addFinancialAnalysisSummary(doc: typeof PDFDocument): void {
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10;
  
    const columnWidths = [
      Math.floor(availableWidth * 0.10), // Measure #
      Math.floor(availableWidth * 0.14), // Descriptions
      Math.floor(availableWidth * 0.10), // Payback
      Math.floor(availableWidth * 0.08), // NPV
      Math.floor(availableWidth * 0.07), // ROI
      Math.floor(availableWidth * 0.07), // IRR
      Math.floor(availableWidth * 0.07), // MIRR
      Math.floor(availableWidth * 0.12), // Annual Increase in NOI
      Math.floor(availableWidth * 0.10), // Annual Savings / sq.ft
      Math.floor(availableWidth * 0.07), // Cost / sq.ft
      Math.floor(availableWidth * 0.10), // Increase in Asset Value
    ];
  
    const headers = [
      'Measure #',
      'Descriptions',
      'Simple Payback (yrs)',
      'NPV',
      'ROI',
      'IRR',
      'MIRR',
      'Annual Increase in NOI',
      'Annual Savings / sq.ft',
      'Cost / sq.ft',
      'Increase in Asset Value',
    ];
  
    const rows = [];
  
    const measurePrefixes = ['EEM', 'WEM', 'RCM'];
    measurePrefixes.forEach(prefix => {
      for (let i = 1; i <= 10; i++) {
        rows.push([
          `${prefix} ${i}`,
          '',
          '0.0',
          '#DIV/0!',
          '0%',
          '0%',
          '0%',
          '#DIV/0!',
          '#DIV/0!',
          '#DIV/0!',
          '#DIV/0!'
        ]);
      }
    });
  
    rows.push([
      'TOTAL',
      '',
      '',
      '#DIV/0!',
      '0%',
      '0%',
      '0%',
      '#DIV/0!',
      '#DIV/0!',
      '#DIV/0!',
      '#DIV/0!'
    ]);
  
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  
    this.addSimpleTable(
      doc,
      headers,
      rows,
      tableWidth,
      {
        columnWidths: columnWidths,
        columnAlignments: ['center', 'left', 'center', 'right', 'center', 'center', 'center', 'right', 'right', 'right', 'right'],
        headerBgColor: '#e6f2e6',
        headerTextColor: '#4A4A4A',
        zebra: true,
        zebraColors: { even: '#FFFFFF', odd: '#f9f9f9' },
        headerHeight: 50,
        rowHeight: 32,
        fontSize: { header: 8, body: 8 }
      }
    );
  }
  private addNextStepsSection(doc: typeof PDFDocument): void {
    // Section Title - matching other sections' style
    doc.fillColor('#4A4A4A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('E. Next Steps:', { align: 'left' })
      .moveDown(0.5);

    // Body text with consistent styling
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .lineGap(4)
      .text('The Energy Efficiency Measures summarized above and throughout the report are conceptual. Additional technical due diligence, planning and design are required prior to implementation. Specifically, management and Vert Energy Group should first set up a planning meeting to determine which measures should be considered for further development and if they contribute to the overall goals of ownership.')
      .moveDown(1);

    doc.font('Helvetica-Bold')
      .text('The following additional tasks are recommended to implement the proposed Energy Management Plan:')
      .font('Helvetica'); // Reset to regular font

    // Bullet points
    const bulletPoints = [
      'Engineering due-diligence, analysis, and preliminary design to confirm overall project performance.',
      'LADWP research and negotiation to determine final rebate amounts.',
      'Project engineering and permitting as applicable.',
      'Contractor solicitation and budgeting.',
      'Financing and execution of construction contracts.'
    ];

    bulletPoints.forEach(point => {
      doc.text(`• ${point}`, { indent: 15 });
    });

    doc.moveDown(1)
      .text('To commence the proposed Energy Management Program (EMP) Property Management should first consider proceeding with energy efficiency measures which have the highest Net Present Values (NPV), and the lowest pay back periods. Additionally, VEG has provided the following guidelines to assist in prioritizing energy efficiency measures.')
      .moveDown(1)
      .font('Helvetica-Bold')
      .text('EEMs & RCM recommended to be implemented first may result in one or more of the following benefits:')
      .font('Helvetica'); // Reset to regular font

    const benefits = [
      'Independent of all other EEMs.',
      'The simplest to implement.',
      'The most cost effective.',
      'Visible to occupants and guests.'
    ];

    benefits.forEach(benefit => {
      doc.text(`• ${benefit}`, { indent: 15 });
    });

    // Add image if it exists
    try {
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
