import PDFDocument from "pdfkit";
import { Injectable } from "@nestjs/common";
import { BaseReportComponent } from "./base-report.component";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class WaterAuditComponent extends BaseReportComponent {
  constructor() {
    super();
    this.sections = [
      "Introduction",
      "Water Audit Procedures",
      "WEMs Cost Savings Summary",
      "Existing Conditions",
      "Recommended WEMs",
      "Implemented WEMs",
      "WEMs to Consider",
      "WEMs Requiring Investigation",
      "Water Use Analysis",
    ];
  }

  /**
   * Renders the water audit section of the report
   * @param doc PDFKit document
   * @param data Object containing water audit data
   */
  render(doc: typeof PDFDocument, data: any): void {
    // Extract data with default empty values to prevent null/undefined errors
    const {
      measures = [],
    } = data || {};

    // Reset layout
    this.resetPageLayout(doc);

    // Brand colors
    const brandGreen = "#4d9b58";
    const sectionGrey = "#4A4A4A";
    doc.moveDown(2);

    doc.x = doc.page.margins.left;

    // Section title (Roman numeral)
    doc
      .fontSize(18)
      .fillColor(brandGreen)
      .font("Helvetica-Bold")
      .text("VI.   Water Audit Report", { align: "left" });
    doc.moveDown(0.5);

    // A. Introduction
    doc
      .fontSize(12)
      .fillColor(sectionGrey)
      .font("Helvetica-Bold")
      .text("A. Introduction:", { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "This section provides a comprehensive analysis of the building's water systems and identifies opportunities for water efficiency improvements."
      );
    doc.moveDown(1);

    // B. Water Audit Procedures
    doc
      .fontSize(12)
      .fillColor(sectionGrey)
      .font("Helvetica-Bold")
      .text("B. Water Audit Procedures:", { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "The water audit was conducted following established procedures, including:"
      );

    const procedures = [
      "Detailed analysis of water bills and consumption patterns",
      "On-site inspection of water systems and fixtures",
      "Identification of leaks and water waste",
      "Measurement of fixture flow rates",
      "Evaluation of irrigation systems",
    ];

    procedures.forEach((procedure) => {
      doc.fontSize(10).text(`• ${procedure}`);
    });
    doc.moveDown(1);

    // C. WEMs Cost Savings Summary Table
    doc
      .fontSize(12)
      .fillColor(sectionGrey)
      .font("Helvetica-Bold")
      .text("C. WEMs Cost Savings Summary Table:", { align: "left" });
    doc.moveDown(0.5);

    // Add a brief description
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "The following table summarizes the water efficiency measures identified for this project, including estimated savings and financial metrics.",
        { align: "left" }
      );
    doc.moveDown(1);

    // Calculate available width based on page margins
    const availableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right - 10; // 10px buffer

    // Distribute column widths proportionally
    const columnWidths = [
      Math.floor(availableWidth * 0.3), // Measure (30%)
      Math.floor(availableWidth * 0.17), // Annual Savings (17%)
      Math.floor(availableWidth * 0.17), // Cost Savings (17%)
      Math.floor(availableWidth * 0.2), // Implementation Cost (20%)
      Math.floor(availableWidth * 0.16), // Payback (16%)
    ];

    const headerCells = [
      "Measure",
      "Annual Savings\n(gal)",
      "Cost Savings\n($)",
      "Implementation\nCost ($)",
      "Payback\n(years)",
    ];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

    // Check if we have any valid data
    const hasData = measures?.some(
      (measure: any) =>
        measure.title?.trim() ||
        measure.estimatedSavings?.water ||
        measure.estimatedSavings?.cost ||
        measure.implementationCost ||
        measure.estimatedSavings?.paybackPeriod
    );

    // Check page space and add new page if needed
    const requiredHeight =
      40 + (hasData && measures ? measures.length * 35 : 35);
    if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }

    if (!hasData || !measures || measures.length === 0) {
      // If no data, show "No data found" message using the simple table
      this.addSimpleTable(
        doc,
        headerCells,
        [
          [
            "No water efficiency measures available",
            "N/A",
            "N/A",
            "N/A",
            "N/A",
          ],
        ],
        tableWidth,
        {
          columnWidths: columnWidths,
          columnAlignments: ["left", "right", "right", "right", "right"],
          headerBgColor: "#e6f2e6",
          headerTextColor: sectionGrey,
          zebra: false,
          fontSize: { header: 9, body: 10 },
        }
      );
    } else {
      // Prepare data rows
      const tableRows = measures.map((measure: any) => {
        // Get values from either format (old or new)
        let title = measure.title || "N/A";
        // Truncate name if it's too long to fit in the column
        const maxNameLength = 40; // Maximum characters for name
        if (title.length > maxNameLength) {
          title = title.substring(0, maxNameLength - 3) + "...";
        }

        // Updated to use the correct property paths for the water efficiency measures
        const waterSavings = measure.estimatedSavings?.water;
        const costSavings = measure.estimatedSavings?.cost;
        const implementationCost = measure.implementationCost;
        const paybackPeriod = measure.estimatedSavings?.paybackPeriod;

        // Format values with consistent decimal places
        return [
          title,
          waterSavings ? this.formatNumber(waterSavings) : "N/A",
          costSavings ? this.formatCurrency(costSavings) : "N/A",
          implementationCost ? this.formatCurrency(implementationCost) : "N/A",
          paybackPeriod ? this.formatNumber(paybackPeriod, 1) : "N/A",
        ];
      });

      // Render the table using the enhanced addSimpleTable method
      this.addSimpleTable(doc, headerCells, tableRows, tableWidth, {
        columnWidths: columnWidths,
        columnAlignments: ["left", "right", "right", "right", "right"],
        headerBgColor: "#e6f2e6",
        headerTextColor: sectionGrey,
        zebra: true,
        zebraColors: { even: "#FFFFFF", odd: "#f9f9f9" },
        headerHeight: 40,
        rowHeight: 35,
        fontSize: { header: 9, body: 10 },
      });
    }
    doc.moveDown(2);
    doc.x = doc.page.margins.left;
    // D. Existing Conditions and Observations
    doc
      .fontSize(12)
      .fillColor(sectionGrey)
      .font("Helvetica-Bold")
      .text("D. Existing Conditions and Observations:", { align: "left" });
    doc.moveDown(0.5);

    const proced = [
      "1. Domestic Indoor Water Use",
      "2. Non-Domestic Indoor Water Use (CT, HVAC)",
      "3. Outdoor Water Use (Irrigation & Landscaping)",
      "4. Industrial Process Water use",
    ];

    proced.forEach((procedure) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`${procedure}`);
      doc.moveDown(0.5);
    });
    doc.moveDown(1);

    this.renderRecommendedMeasures(doc, measures);
    doc.moveDown(2);

    this.renderImplementedMeasures(doc, measures);
    doc.moveDown(2);

    this.renderMeasuresToConsider(doc, measures);
    doc.moveDown(10);

    this.renderInvestigation(doc, measures);
    doc.moveDown(30);

    this.renderNonEfficiency(doc, measures);
    doc.moveDown(2);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#4A4A4A")
      .text("J. Water Use Analysis");
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("1. Building Water Use Intensity (WUI)");
    const boxX = 140;
    const boxY = doc.y;
    this.renderWaterUseIntensityBox(doc, boxX, boxY);
    doc.moveDown(1);

    doc.x = doc.page.margins.left;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("2. ENERGY STAR® Water Scorecard (for MF only)");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("The U.S. Environmental Protection Agency's (EPA) Water Score is generated by the ENERGY STAR® Portfolio Manager® tool and supported by WaterSense®. The Score offers a 1 - 100 measurement of how efficiently this property uses water, compared to similar properties nationwide, when normalized for climate and operational characteristics.");
    doc.moveDown(1);


    this.renderWaterScorecard(doc, measures);
    doc.moveDown(4);
    doc.x = doc.page.margins.left;
    
    this.renderWaterBalanceChart(doc);
    doc.moveDown(1);
 
    const endUseBreakdown = [
      { category: 'Landscape', percentage: 53, color: '#2A67BB' },
      { category: 'Lavatry', percentage: 27, color: '#D02129' },
      { category: 'Cooking', percentage: 20, color: '#97C15C' },
    ];
    this.renderTHERMSPieChart(doc, endUseBreakdown);
      doc.moveDown(8);
    doc.x = doc.page.margins.left;
  }

  private renderRecommendedMeasures(
    doc: typeof PDFDocument,
    measures: any[]
  ): void {
    // Section header - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(12)
      .fillColor("#4A4A4A")
      .font("Helvetica-Bold")
      .text("E. Water Efficiency Measures Recommended", { align: "left" });
    doc.moveDown(0.5);

    // Introductory paragraph - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "As a part of the water audit report, includes a series of measures (WEMs), which when implemented should accrue water cost reductions approaching those estimated for each measure. The development of these measures is still conceptual and will require additional technical due diligence, planning and design prior to implementation.",
        {
          align: "left",
          lineGap: 4,
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        }
      );
    doc.moveDown(2);

    // Path to assets folder
    const assetsPath = path.join(__dirname, "../../../../assets");

    // Create sample measures if none exist
    const measuresToRender =
      measures?.filter((m) => m.status === "recommended") || [];
    const sampleMeasures = Array(6)
      .fill(null)
      .map((_, i) => ({
        title: `EEM ${i + 1}: xxxxxxxxxxxx`,
        existingCondition: " xxxxxxxxxx",
        recommendation: " xxxxxxxxxx",
        images: [
          {
            id: `sample-id-${i}-1`,
            filename: "image2.png",
          },
          {
            id: `sample-id-${i}-2`,
            filename: "image2.png",
          },
        ],
      }));

    const finalMeasures =
      measuresToRender.length > 0 ? measuresToRender : sampleMeasures;

    finalMeasures.forEach((measure, index) => {
      // Reset to left margin for each measure
      doc.x = doc.page.margins.left;

      // Calculate required height for this measure
      const textHeight = 100; // Approximate height for text content
      const imageSectionHeight = 200; // Height for images and their labels

      // Check if we need a new page before starting this measure
      if (
        doc.y + textHeight + imageSectionHeight >
        doc.page.height - doc.page.margins.bottom
      ) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Measure title - force left alignment
      doc
        .fontSize(11)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(
          `${index + 1}. ${measure.title || `EEM ${index + 1}: [Measure Name]`}`
        );
      doc.moveDown(0.75);

      // Existing Condition - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Existing Condition:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.existingCondition || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Recommendation - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Recommendation:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.recommendation || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Check again for image section - we need about 200 points of vertical space
      if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Supporting Images header - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Supporting Images:");
      doc.moveDown(0.5);

      // Image parameters
      let imageWidth = 180;
      const imageHeight = 135;
      let imageMargin = 20;
      let currentX = doc.page.margins.left;

      // Calculate if images can fit in one row
      const images = measure.images || [];
      const totalImagesWidth =
        imageWidth * images.length + imageMargin * (images.length - 1);
      const availableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      if (totalImagesWidth > availableWidth) {
        // If images don't fit, reduce width and margin
        imageWidth = 150;
        imageMargin = 10;
      }

      // Initial Y position for images
      const imagesStartY = doc.y;

      // Render all images in a single row
      images.forEach((img: { filename: string; id: any }, imgIndex: number) => {
        // Image number above the image
        doc
          .fontSize(10)
          .fillColor("#000000")
          .text(`${imgIndex + 1}`, currentX, imagesStartY, {
            width: imageWidth,
            align: "center",
          });

        try {
          if (img.filename) {
            const imagePath = path.join(assetsPath, img.filename);
            if (fs.existsSync(imagePath)) {
              doc.image(imagePath, currentX, imagesStartY + 15, {
                width: imageWidth,
                height: imageHeight,
                align: "center",
              });
            } else {
              this.renderImagePlaceholder(
                doc,
                currentX,
                imagesStartY + 15,
                imageWidth,
                imageHeight
              );
            }
          } else {
            this.renderImagePlaceholder(
              doc,
              currentX,
              imagesStartY + 15,
              imageWidth,
              imageHeight
            );
          }
        } catch (e) {
          this.renderImagePlaceholder(
            doc,
            currentX,
            imagesStartY + 15,
            imageWidth,
            imageHeight
          );
        }

        // ID below the image
        doc
          .fontSize(8)
          .fillColor("#999999")
          .text(
            `ID: ${img.id || "N/A"}`,
            currentX,
            imagesStartY + 15 + imageHeight + 5,
            {
              width: imageWidth,
              align: "center",
            }
          );

        // Move right for next image
        currentX += imageWidth + imageMargin;
      });

      // Set new Y position after images
      doc.y = imagesStartY + 15 + imageHeight + 25;
      doc.x = doc.page.margins.left; // Reset to left margin

      // If no images, show message
      if (images.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#666666")
          .text("No supporting images available", { indent: 10 });
      }

      // Space between measures
      doc.moveDown(1.5);
    });
  }

  private renderInvestigation(
    doc: typeof PDFDocument,
    measures: any[]
  ): void {
    // Section header - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(12)
      .fillColor("#4A4A4A")
      .font("Helvetica-Bold")
      .text("H. WEMs Requiring Further Investigation", { align: "left" });
    doc.moveDown(0.5);

    // Introductory paragraph - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "The following section outlines additional water efficiency measures which require greater study and testing to determine the on-site feasibility. The required tests exceed the scope of this study; however, these measures are encouraged to be investigated further.",
        {
          align: "left",
          lineGap: 4,
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        }
      );
    doc.moveDown(2);

    // Path to assets folder
    const assetsPath = path.join(__dirname, "../../../../assets");

    // Create sample measures if none exist
    const measuresToRender =
      measures?.filter((m) => m.status === "recommended") || [];
    const sampleMeasures = Array(1)
      .fill(null)
      .map((_, i) => ({
        title: `EEM ${i + 1}: xxxxxxxxxxxx`,
        existingCondition: " xxxxxxxxxx",
        recommendation: " xxxxxxxxxx",
        images: [
          {
            id: `sample-id-${i}-1`,
            filename: "image2.png",
          },
          {
            id: `sample-id-${i}-2`,
            filename: "image2.png",
          },
        ],
      }));

    const finalMeasures =
      measuresToRender.length > 0 ? measuresToRender : sampleMeasures;

    finalMeasures.forEach((measure, index) => {
      // Reset to left margin for each measure
      doc.x = doc.page.margins.left;

      // Calculate required height for this measure
      const textHeight = 100; // Approximate height for text content
      const imageSectionHeight = 200; // Height for images and their labels

      // Check if we need a new page before starting this measure
      if (
        doc.y + textHeight + imageSectionHeight >
        doc.page.height - doc.page.margins.bottom
      ) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Measure title - force left alignment
      doc
        .fontSize(11)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(
          `${index + 1}. ${measure.title || `EEM ${index + 1}: [Measure Name]`}`
        );
      doc.moveDown(0.75);

      // Existing Condition - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Existing Condition:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.existingCondition || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Recommendation - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Recommendation:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.recommendation || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Check again for image section - we need about 200 points of vertical space
      if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Supporting Images header - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Supporting Images:");
      doc.moveDown(0.5);

      // Image parameters
      let imageWidth = 180;
      const imageHeight = 135;
      let imageMargin = 20;
      let currentX = doc.page.margins.left;

      // Calculate if images can fit in one row
      const images = measure.images || [];
      const totalImagesWidth =
        imageWidth * images.length + imageMargin * (images.length - 1);
      const availableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      if (totalImagesWidth > availableWidth) {
        // If images don't fit, reduce width and margin
        imageWidth = 150;
        imageMargin = 10;
      }

      // Initial Y position for images
      const imagesStartY = doc.y;

      // Render all images in a single row
      images.forEach((img: { filename: string; id: any }, imgIndex: number) => {
        // Image number above the image
        doc
          .fontSize(10)
          .fillColor("#000000")
          .text(`${imgIndex + 1}`, currentX, imagesStartY, {
            width: imageWidth,
            align: "center",
          });

        try {
          if (img.filename) {
            const imagePath = path.join(assetsPath, img.filename);
            if (fs.existsSync(imagePath)) {
              doc.image(imagePath, currentX, imagesStartY + 15, {
                width: imageWidth,
                height: imageHeight,
                align: "center",
              });
            } else {
              this.renderImagePlaceholder(
                doc,
                currentX,
                imagesStartY + 15,
                imageWidth,
                imageHeight
              );
            }
          } else {
            this.renderImagePlaceholder(
              doc,
              currentX,
              imagesStartY + 15,
              imageWidth,
              imageHeight
            );
          }
        } catch (e) {
          this.renderImagePlaceholder(
            doc,
            currentX,
            imagesStartY + 15,
            imageWidth,
            imageHeight
          );
        }

        // ID below the image
        doc
          .fontSize(8)
          .fillColor("#999999")
          .text(
            `ID: ${img.id || "N/A"}`,
            currentX,
            imagesStartY + 15 + imageHeight + 5,
            {
              width: imageWidth,
              align: "center",
            }
          );

        // Move right for next image
        currentX += imageWidth + imageMargin;
      });

      // Set new Y position after images
      doc.y = imagesStartY + 15 + imageHeight + 25;
      doc.x = doc.page.margins.left; // Reset to left margin

      // If no images, show message
      if (images.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#666666")
          .text("No supporting images available", { indent: 10 });
      }

      // Space between measures
      doc.moveDown(1.5);
    });
  }

  private renderNonEfficiency(
    doc: typeof PDFDocument,
    measures: any[]
  ): void {
    // Section header - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(12)
      .fillColor("#4A4A4A")
      .font("Helvetica-Bold")
      .text("I. Non-Efficiency Water Measure/s ", { align: "left" });
    doc.moveDown(0.5);

    // Introductory paragraph - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "The following water measure/s do not directly conserve water usage but can result in decreased water and/or sewage utility costs.",
        {
          align: "left",
          lineGap: 4,
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        }
      );
    doc.moveDown(2);

    // Path to assets folder
    const assetsPath = path.join(__dirname, "../../../../assets");

    // Create sample measures if none exist
    const measuresToRender =
      measures?.filter((m) => m.status === "recommended") || [];
    const sampleMeasures = Array(1)
      .fill(null)
      .map((_, i) => ({
        title: `EEM ${i + 1}: xxxxxxxxxxxx`,
        existingCondition: " xxxxxxxxxx",
        recommendation: " xxxxxxxxxx",
        images: [
          {
            id: `sample-id-${i}-1`,
            filename: "image2.png",
          },
          {
            id: `sample-id-${i}-2`,
            filename: "image2.png",
          },
        ],
      }));

    const finalMeasures =
      measuresToRender.length > 0 ? measuresToRender : sampleMeasures;

    finalMeasures.forEach((measure, index) => {
      // Reset to left margin for each measure
      doc.x = doc.page.margins.left;

      // Calculate required height for this measure
      const textHeight = 100; // Approximate height for text content
      const imageSectionHeight = 200; // Height for images and their labels

      // Check if we need a new page before starting this measure
      if (
        doc.y + textHeight + imageSectionHeight >
        doc.page.height - doc.page.margins.bottom
      ) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Measure title - force left alignment
      doc
        .fontSize(11)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(
          `${index + 1}. ${measure.title || `EEM ${index + 1}: [Measure Name]`}`
        );
      doc.moveDown(0.75);

      // Existing Condition - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Existing Condition:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.existingCondition || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Recommendation - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Recommendation:");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(measure.recommendation || "", {
          indent: 10,
          lineGap: 3,
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            10,
        });
      doc.moveDown(0.3);

      // Check again for image section - we need about 200 points of vertical space
      if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.x = doc.page.margins.left;
      }

      // Supporting Images header - force left alignment
      doc.x = doc.page.margins.left;
      doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Supporting Images:");
      doc.moveDown(0.5);

      // Image parameters
      let imageWidth = 180;
      const imageHeight = 135;
      let imageMargin = 20;
      let currentX = doc.page.margins.left;

      // Calculate if images can fit in one row
      const images = measure.images || [];
      const totalImagesWidth =
        imageWidth * images.length + imageMargin * (images.length - 1);
      const availableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      if (totalImagesWidth > availableWidth) {
        // If images don't fit, reduce width and margin
        imageWidth = 150;
        imageMargin = 10;
      }

      // Initial Y position for images
      const imagesStartY = doc.y;

      // Render all images in a single row
      images.forEach((img: { filename: string; id: any }, imgIndex: number) => {
        // Image number above the image
        doc
          .fontSize(10)
          .fillColor("#000000")
          .text(`${imgIndex + 1}`, currentX, imagesStartY, {
            width: imageWidth,
            align: "center",
          });

        try {
          if (img.filename) {
            const imagePath = path.join(assetsPath, img.filename);
            if (fs.existsSync(imagePath)) {
              doc.image(imagePath, currentX, imagesStartY + 15, {
                width: imageWidth,
                height: imageHeight,
                align: "center",
              });
            } else {
              this.renderImagePlaceholder(
                doc,
                currentX,
                imagesStartY + 15,
                imageWidth,
                imageHeight
              );
            }
          } else {
            this.renderImagePlaceholder(
              doc,
              currentX,
              imagesStartY + 15,
              imageWidth,
              imageHeight
            );
          }
        } catch (e) {
          this.renderImagePlaceholder(
            doc,
            currentX,
            imagesStartY + 15,
            imageWidth,
            imageHeight
          );
        }

        // ID below the image
        doc
          .fontSize(8)
          .fillColor("#999999")
          .text(
            `ID: ${img.id || "N/A"}`,
            currentX,
            imagesStartY + 15 + imageHeight + 5,
            {
              width: imageWidth,
              align: "center",
            }
          );

        // Move right for next image
        currentX += imageWidth + imageMargin;
      });

      // Set new Y position after images
      doc.y = imagesStartY + 15 + imageHeight + 25;
      doc.x = doc.page.margins.left; // Reset to left margin

      // If no images, show message
      if (images.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#666666")
          .text("No supporting images available", { indent: 10 });
      }

      // Space between measures
      doc.moveDown(1.5);
    });
  }

  private renderImagePlaceholder(
    doc: typeof PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    doc.rect(x, y, width, height).fill("#f5f5f5").stroke("#cccccc");

    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Photo not available", x + 10, y + height / 2 - 10, {
        width: width - 20,
        align: "center",
      });
  }

  private renderImplementedMeasures(
    doc: typeof PDFDocument,
    measures: any[]
  ): void {
    const filtered = measures?.filter((m) => m.status === "implemented") || [];

    // Section header - force left alignment
    doc.x = doc.page.margins.left;
    doc
      .fontSize(12)
      .fillColor("#4A4A4A")
      .font("Helvetica-Bold")
      .text("F. EEMs Already Implemented", { align: "left" });
    doc.moveDown(0.5);

    // Introductory paragraph
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text(
        "The management has taken proactive steps in increasing the water efficiency of the property. The following upgraded equipment was observed to be installed during the site visit. "
      );
    doc.moveDown(1);

    // List of implemented measures
    const measureCount = Math.max(filtered.length, 6);
    for (let i = 0; i < measureCount; i++) {
      const measureText = filtered[i]
        ? `${i + 1}. ${filtered[i].title || filtered[i].name || "Implemented measure"}`
        : `${i + 1}. xxxxxxxxxx`;

      doc.fontSize(10).fillColor("#000000").font("Helvetica").text(measureText);
    }
    doc.moveDown(1);

    // Supporting images header
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Supporting images:");
    doc.moveDown(0.5);

    // Image grid parameters
    const imageWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 20) / 2;
    const imageHeight = 100;
    const labelHeight = 15;
    const rowSpacing = 30;
    const colSpacing = 20;

    let currentY = doc.y;

    for (let i = 0; i < 3; i++) {
      const leftX = doc.page.margins.left;
      const rightX = leftX + imageWidth + colSpacing;

      this.renderImageWithLabel(doc, leftX, currentY, imageWidth, imageHeight);
      this.renderImageWithLabel(doc, rightX, currentY, imageWidth, imageHeight);
      currentY += imageHeight + labelHeight + rowSpacing;
    }

    doc.y = currentY;
  }

  private renderImageWithLabel(
    doc: typeof PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    // Add page if needed
    if (y + height + 15 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    // Image box
    doc.rect(x, y, width, height).fill("#f5f5f5").stroke("#cccccc");

    // Optional "Photo not available" message
    doc
      .fontSize(10)
      .fillColor("#aaaaaa")
      .text("", x + width / 2 - 10, y + height / 2 - 5, {
        align: "center",
        width: width,
      });

    // Label below box (like "xxxxxxxxxx")
    doc
      .fontSize(10)
      .fillColor("#000000")
      .font("Helvetica")
      .text("xxxxxxxxxx", x, y + height + 5, {
        width: width,
        align: "center",
      });
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
      .text('The following measures have been identified to increase the water efficiency of the property; however, these measures were priced using standard cost estimates, which were unable to justify the Return on Investment (ROI). Nonetheless, the viability of these measures should be investigated further by the client. ', {
        align: 'left',
        lineGap: 4,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right
      });
    doc.moveDown(1.5);

    // Render measures
    const measureCount = Math.max(filtered.length, 2);
    for (let i = 0; i < measureCount; i++) {
      const measure = filtered[i] || {};

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

  private renderWaterUseIntensityBox(
    doc: typeof PDFDocument,
    x: number,
    y: number
  ): void {
    const boxWidth = 180;
    const rowHeight = 30;
    const headerHeight = 50;
    const boxHeight = headerHeight + 2 * rowHeight;
    const radius = 8;

    // Draw outer rounded rectangle
    doc
      .roundedRect(x, y, boxWidth, boxHeight, radius)
      .fillAndStroke("#f0f0f0", "#cccccc");

    // Simulate a gradient header with a solid color fallback
    doc.save();
    doc
      .fillColor("#0077B6")
      .moveTo(x + radius, y)
      .lineTo(x + boxWidth - radius, y)
      .quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius)
      .lineTo(x + boxWidth, y + headerHeight)
      .lineTo(x, y + headerHeight)
      .lineTo(x, y + radius)
      .quadraticCurveTo(x, y, x + radius, y)
      .fill();
    doc.restore();

    // Header text
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        "Water Use Intensity (All Water Sources) (gal/ft²)",
        x + 10,
        y + 15,
        {
          width: boxWidth - 20,
          align: "center",
        }
      );

    const textVerticalOffset = (rowHeight - 11) / 2;

    // Current WUI Label
    doc
      .fillColor("#0077B6")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Current WUI:", x + 10, y + headerHeight + textVerticalOffset);

    // Current WUI Value
    doc
      .fillColor("#4A4A4A")
      .font("Helvetica")
      .fontSize(11)
      .text(
        "19.2",
        x + boxWidth - 40,
        y + headerHeight + textVerticalOffset
      );

    // Baseline WUI Label
    doc
      .fillColor("#0077B6")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        "Baseline WUI:",
        x + 10,
        y + headerHeight + rowHeight + textVerticalOffset
      );

    // Baseline WUI Value
    doc
      .fillColor("#4A4A4A")
      .font("Helvetica")
      .fontSize(11)
      .text(
        "17.1",
        x + boxWidth - 40,
        y + headerHeight + rowHeight + textVerticalOffset
      );
  }

  private renderWaterScorecard(doc: typeof PDFDocument, data: any): void {
    // Check if we need a new page for this section
    if (doc.y + 350 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }

    // Reset to left margin
    doc.x = doc.page.margins.left;

    // Section header
    doc.fontSize(16)
      .fillColor('#0066CC')
      .font('Helvetica-Bold')
      .text('WATER SCORECARD', { align: 'center' });
    doc.moveDown(0.5);

    // Create box for the scorecard
    const startY = doc.y;
    const boxWidth = 400;
    const boxHeight = 360;
    const boxX = (doc.page.width - boxWidth) / 2;

    doc.rect(boxX, startY, boxWidth, boxHeight)
      .lineWidth(2)
      .stroke('#000000');

    // Large score number
    doc.fontSize(60)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(data.waterScore || '35', boxX + 50, startY + 40, { align: 'left' });

    // "out of 100" text
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('out of 100', boxX + 50, startY + 105);

    // Building information (left side)
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('Primary Function:', boxX + 160, startY + 40);
    doc.font('Helvetica')
      .text(data.primaryFunction || 'Multifamily Housing', boxX + 250, startY + 40);

    doc.font('Helvetica-Bold')
      .text('Gross Floor Area (Ft²):', boxX + 160, startY + 55);
    doc.font('Helvetica')
      .text(data.grossFloorArea || '70,965', boxX + 250, startY + 55);

    doc.font('Helvetica-Bold')
      .text('Built:', boxX + 160, startY + 70);
    doc.font('Helvetica')
      .text(data.builtYear || '1950', boxX + 250, startY + 70);

    // Property information (right side)
    doc.font('Helvetica-Bold')
      .text('Property Address:', boxX + 160, startY + 95);
    doc.font('Helvetica')
      .text(data.propertyAddress1 || '5348 Newcastle Avenue', boxX + 250, startY + 95);
    doc.text(data.propertyAddress2 || 'Encino, California 91316', boxX + 250, startY + 110);

    doc.font('Helvetica-Bold')
      .text('For Year Ending:', boxX + 160, startY + 130);
    doc.font('Helvetica')
      .text(data.forYearEnding || 'December 31, 2019', boxX + 250, startY + 130);

    doc.font('Helvetica-Bold')
      .text('Date Generated:', boxX + 160, startY + 145);
    doc.font('Helvetica')
      .text(data.dateGenerated || 'April 16, 2020', boxX + 250, startY + 145);

    // Water usage information
    doc.fontSize(9)
      .font('Helvetica')
      .text(`For the year ending December 2019, this building used ${data.waterGallonsPerSqFt || '47.87'} gallons of water per square feet.`,
        boxX + 20, startY + 175);
    doc.text("Here's how that compares to similar buildings nationwide:", boxX + 20, startY + 190);

    // Draw the score scale
    const scaleY = startY + 242;
    const scaleWidth = boxWidth - 40;
    const scaleX = boxX + 20;

    // Draw line
    doc.moveTo(scaleX, scaleY)
      .lineTo(scaleX + scaleWidth, scaleY)
      .lineWidth(1)
      .stroke('#000000');

    // Draw scale endpoints
    doc.fontSize(9)
      .text('1', scaleX, scaleY + 5)
      .text('100', scaleX + scaleWidth - 15, scaleY + 5);

    // Draw "Average" marker in the middle
    doc.text('Average', scaleX + (scaleWidth / 2) - 20, scaleY + 5);

    // Draw efficiency labels
    doc.fontSize(8)
      .text('Least', scaleX, scaleY + 20)
      .text('Efficient', scaleX, scaleY + 30);

    doc.text('Most', scaleX + scaleWidth - 15, scaleY + 20)
      .text('Efficient', scaleX + scaleWidth - 25, scaleY + 30);

    // Draw the score triangle/marker
    doc.moveDown(5)
    const score = parseInt(data.waterScore || '35');
    const scorePosition = scaleX + (score / 100 * scaleWidth);

    // Draw triangle
    doc.moveTo(scorePosition, scaleY - 15)
      .lineTo(scorePosition - 8, scaleY - 5)
      .lineTo(scorePosition + 8, scaleY - 5)
      .fill('#000000');

    // Draw score number above triangle
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text(score.toString(), scorePosition - 8, scaleY - 40, { width: 16, align: 'center' });

    // Add explanatory text
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .text('About this Score', boxX + 20, startY + 285);

    doc.font('Helvetica')
      .fontSize(7)
      .text('The U.S. Environmental Protection Agency\'s (EPA) Water Score is generated by the ENERGY STAR® Portfolio Manager® and represents the water efficiency of your building. The score is a 1 - 100 measurement of how efficiently the property uses water compared to similar properties nationwide, after adjusting for climate and operational characteristics. Learn more at energystar.gov/buildings.',
        boxX + 20, startY + 296, { width: boxWidth - 40 });

    // Update doc.y to after the box
    doc.y = startY + boxHeight + 10;

    doc.x = doc.page.margins.left; // Reset to left margin
    doc.moveDown(3);
    this.renderWaterUsageAndCost(doc);
  }

  private renderWaterUsageAndCost(doc: typeof PDFDocument): void {
    // Section header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("3. Water Usage and Cost");
    doc.moveDown(0.5);

    // Description paragraph
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("This section summarizes water analysis of purchased water by end use (water Balance). It includes a tabular summary of water usage and costs over a one (1) year period in addition to the ENERGY STAR® Water Scorecard.");
    doc.moveDown(0.5);

    // First note
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("Note:");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("The water analysis is based on LADWP whole building aggregate data (Tenant and common areas)");
    doc.moveDown(0.3);

    // First note continuation
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("Tenant water use is not separately metered, the building Owner(s) / Management are responsible for the building water cost.");
    doc.moveDown(0.5);

    // Second note
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("Note:");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("The water analysis is based on LADWP whole building aggregate data.");
    doc.moveDown(0.3);

    // Second note continuation
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("Tenant(s) share responsible for the building water use and cost");
    doc.moveDown(0.5);

    // Summary paragraph
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("The following observations, table and graphs summarize the results of the annual water usage and cost analysis.");
    doc.moveDown(0.5);

    // Data review paragraph
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("VEG reviewed water rating this from January 2021 through December 2021. The building purchases water from LADWP, during this period, the building consumed - gallon, or $0 worth of water and sewer at an average rate of $100/10/gallon under Schedule B Multi-Dwelling Unit.");
    doc.moveDown(1);

    // Define monthlyData with sample data
    const monthlyData = [
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
    this.renderMonthlyUsageChart(doc, monthlyData);
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
      .text('Monthly Water Usage Vs Cost', chartX, chartY + 10, {
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
      .text('Monthly Usage', graphX + 25, legendY + 1);

    doc.rect(graphX + 140, legendY, 10, 10)
      .fill('#89b6ff')
      .stroke('#89b6ff');
    doc.fontSize(8)
      .fillColor('#333333')
      .text('Water Cost ($)', graphX + 155, legendY + 1);

    // Move doc.y below legend for next section
    doc.y = legendY + 20;

  }

  private renderWaterBalanceChart(doc: typeof PDFDocument): void {
    // Section header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("4. Water Balance Chart");
    doc.moveDown(0.5);

    // Description paragraph
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("The distribution of water uses shown below is based on the auditor's field observations, as well as industry standard estimates.");
    doc.moveDown(1);

    // Indoor water use factors header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("Several factors affect indoor water use:");
    doc.moveDown(0.5);

    // Indoor water use bullet points
    const indoorFactors = [
      "Type, age, and condition of water-using fixtures",
      "Climate",
      "The price of water the tenants pay"
    ];

    indoorFactors.forEach(factor => {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("black")
        .text(`• ${factor}`, { indent: 10 });
    });
    doc.moveDown(1);

    // Outdoor water use paragraph
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("black")
      .text("Outdoor water use is highly site-specific and depends on the square footage of landscaped areas and the efficiency of irrigation systems and procedures. Fountains, and other decorative water fixtures will also impact the volume of water used outdoors.");
    doc.moveDown(1);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666666")
      .text("[Water Balance Chart Visualization Would Appear Here]", {
        align: "center",
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right
      });
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
       const titleText = 'Building Water Balance';
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
       validData.forEach((item: { percentage: number; color: PDFKit.Mixins.ColorValue | undefined; }) => {
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

      validData.forEach((item: { category: string; percentage: number; color: string }) => {
         const labelText: string = `${item.category}: ${item.percentage}%`;
         const swatchY: number = currentY + (LEGEND_CONFIG.itemHeight - LEGEND_CONFIG.swatchSize) / 2;

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

}

