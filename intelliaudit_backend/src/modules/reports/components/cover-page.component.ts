import PDFDocument from 'pdfkit';
import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { BaseReportComponent } from './base-report.component';

@Injectable()
export class CoverPageComponent extends BaseReportComponent {
  private readonly logger = new Logger(CoverPageComponent.name);
  
  /**
   * Renders the cover page of the report
   * @param doc PDFKit document
   * @param project Project data for the report
   */
  async render(doc: typeof PDFDocument, project: any): Promise<void> {
    this.resetPageLayout(doc);
    
    // Set up the split layout cover page with white left side and gray right side
    const margin = 50;
    const width = doc.page.width;
    const height = doc.page.height;
    const splitPosition = width * 0.6; // 60% left, 40% right
    
    // Draw the white and gray backgrounds
    doc.rect(0, 0, width, height).fill('white'); // Set full page background to white
    doc.rect(splitPosition, 0, width - splitPosition, height).fill('#e0e0e0'); // Gray right side
    
    // ----- LEFT SIDE CONTENT -----
    
    // Add logo at the top left
    const logoUrl = process.env.COMPANY_LOGO_URL || 
      'https://ueatpdrgktpdcrrgeshi.supabase.co/storage/v1/object/public/assets/vert_logo/Vert-Energy-Group-Logo-Official-compress.png';
    
    // Try to fetch and load the logo using await
    try {
      const logoBuffer = await this.fetchLogoImage(logoUrl);
      doc.image(logoBuffer, margin, margin, { width: 200 });
    } catch (error) {
      // Text fallback for logo
      this.logger.error(`Error loading logo from URL: ${error.message}`);
      doc.fontSize(20)
         .fillColor('#4d9b58')
         .font('Helvetica-Bold')
         .text('VERT', margin, margin + 30)
         .fillColor('#666666')
         .text('Energy Group', margin + 80, margin + 30);
    }
    
    // ----- RIGHT SIDE CONTENT -----
    
    // Extract street name for first line display - use building_address as primary source
    const streetAddress = project?.building_address || '';
    const cityStateZip = project?.property_city && project?.property_state && project?.property_postal_code 
      ? `${project.property_city}, ${project.property_state} ${project.property_postal_code}`
      : '';
    
    // Construct full address - use building_address which already has the complete address if available
    const fullAddress = streetAddress || 
      (project?.property_address ? 
        `${project.property_address}${cityStateZip ? ', ' + cityStateZip : ''}` 
        : '');
    
    // Extract just the street name portion for the top line (first part before the comma)
    const streetNameParts = streetAddress.split(',')[0].split(' ');
    let streetNumber = '';
    let streetName = '';
    
    if (streetNameParts.length >= 2) {
      // Assuming format is typically "number street" like "819 S. Hobart"
      streetNumber = streetNameParts[0] || '';
      
      // For street name, remove suffixes like Blvd, Rd, etc.
      const streetWords = streetNameParts.slice(1);
      const suffixesToRemove = ['Blvd', 'Blvd.', 'Boulevard', 'Rd', 'Rd.', 'Road', 'St', 'St.', 'Street', 'Ave', 'Ave.', 'Avenue', 'Dr', 'Dr.', 'Drive'];
      
      // Filter out any suffix words
      const filteredStreetWords = streetWords.filter((word: string) => !suffixesToRemove.includes(word));
      
      // If filtering removed all words, use the original words
      streetName = filteredStreetWords.length > 0 ? filteredStreetWords.join(' ') : streetWords.join(' ');
    } else {
      // Fallback if we can't parse properly
      streetName = streetAddress.split(',')[0] || '';
    }
    
    // Property address at top right
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text(streetNumber + ' ' + streetName, splitPosition + 20, margin + 10);
    
    // Full address below the main property name
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(fullAddress, 
             splitPosition + 20, 
             margin + 40, 
             { width: width - splitPosition - 40 });
    
    // Building ID - use dynamic data
    const buildingId = project?.pm_id || project?.building_id || '';
    if (buildingId) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`Building ID: ${buildingId}`, 
               splitPosition + 20, 
               margin + 70);
    }
    
    // Date with superscript for "st"
    // Extract day number for superscript handling  
    let day = '';
    let month = '';
    let year = '';
    
    try {
      if (project?.created_at) {
        const date = new Date(project.created_at);
        day = date.getDate().toString();
        month = date.toLocaleDateString('en-US', { month: 'long' });
        year = date.getFullYear().toString();
      } else {
        // If no created_at date, use current date
        const currentDate = new Date();
        day = currentDate.getDate().toString();
        month = currentDate.toLocaleDateString('en-US', { month: 'long' });
        year = currentDate.getFullYear().toString();
      }
    } catch (e) {
      // If error occurs, use current date
      const currentDate = new Date();
      day = currentDate.getDate().toString();
      month = currentDate.toLocaleDateString('en-US', { month: 'long' });
      year = currentDate.getFullYear().toString();
    }
    
    // Add date with superscript
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`${month} ${day}`, 
             splitPosition + 20, 
             margin + 90);
    
    // Add superscript based on day
    let superscript = '';
    if (day === '1' || day === '21' || day === '31') {
      superscript = 'st';
    } else if (day === '2' || day === '22') {
      superscript = 'nd';
    } else if (day === '3' || day === '23') {
      superscript = 'rd';
    } else {
      superscript = 'th';
    }
    
    // Add superscript and year
    const textWidth = doc.widthOfString(`${month} ${day}`);
    doc.fontSize(6)
       .text(superscript, 
             splitPosition + 20 + textWidth, 
             margin + 88);
    
    doc.fontSize(10)
       .text(`, ${year}`, 
             splitPosition + 20 + textWidth + doc.widthOfString(superscript), 
             margin + 90);
    
    // ----- GREEN TITLE BANNER ACROSS THE PAGE -----
    
    const bannerY = height * 0.23; // Position banner at 35% down the page
    const bannerHeight = height * 0.14; // 15% of page height
    const bannerPadding = 60;
    
    doc.rect(0, bannerY, width-bannerPadding, bannerHeight)
       .fill('#4d9b58'); // Green banner
    
    // Add ASHRAE title text to banner (centered)
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('white')
       .text('ASHRAE Level II Energy Audit, ', 
             margin, 
             bannerY + 20, 
             { width: width - 120, align: 'center' });
    
    doc.text('Water Audit', 
             margin, 
             bannerY + 45, 
             { width: width - 120, align: 'center' });
    
    doc.text('& Retro-commissioning Report', 
             margin, 
             bannerY + 70, 
             { width: width - 120, align: 'center' });
    
    // ----- BUILDING IMAGE -----
    
    // Add placeholder for building image below banner
    const imageY = bannerY + bannerHeight + 20;
    const imageWidth = width * 0.5; // 70% of page width
    const imageHeight = height * 0.35; // 25% of page height
    const imageX = (width - imageWidth) / 2; // Center horizontally
    
    // Try to load building image if available
    let buildingImageLoaded = false;
    
    try {
      const fallbackImagePath = path.join(__dirname, '../../../../assets/image.png');
      const imageUrl = project.satellite_image_url;
    
      let imageBuffer: Buffer;
    
      try {
        if (imageUrl) {
          imageBuffer = await this.fetchLogoImage(imageUrl);
          this.logger.log('Loaded satellite image from URL.');
        } else {
          throw new Error('No satellite image URL provided, falling back to local image.');
        }
      } catch (imageError) {
        this.logger.warn(`Remote image failed, using fallback. Reason: ${imageError.message}`);
        imageBuffer = fs.readFileSync(fallbackImagePath);
      }
    
      // Create a white border/frame around the image (10px padding)
      const framePadding = 10;
      doc.rect(imageX - framePadding, imageY - framePadding, 
              imageWidth + (framePadding * 2), imageHeight + (framePadding * 2))
         .lineWidth(1)
         .fillColor('white')
         .strokeColor('#999999')
         .fillAndStroke();
    
      // Clip image boundaries
      doc.save();
      doc.rect(imageX, imageY, imageWidth, imageHeight).clip();
    
      // Display the image
      doc.image(imageBuffer, imageX, imageY, {
        width: imageWidth,
        height: imageHeight,
      });
    
      doc.restore();
      buildingImageLoaded = true;
    
    } catch (error) {
      this.logger.error(`Failed to load building image: ${error.message}`);
      buildingImageLoaded = false;
    }
    
    
    if (!buildingImageLoaded) {
      // Draw placeholder for building image with border
      doc.rect(imageX, imageY, imageWidth, imageHeight)
         .lineWidth(1)
         .strokeColor('#999999')
         .fillAndStroke('#f5f5f5', '#999999');
      
      // Add placeholder text with property address to make it clear this is a placeholder
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#999999')
         .text(`Building Image Placeholder for ${project?.name || (streetAddress ? (streetAddress.split(',')[0]) : 'Property')}`, 
               imageX + 20, 
               imageY + imageHeight / 2 - 20, 
               { width: imageWidth - 40, align: 'center' });
    }
    
    // ----- PREPARED BY SECTION -----
    
    // Add "Prepared by:" text at bottom
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('Prepared by:', 
             splitPosition + 20, 
             height - margin * 3.25);
    
    // Company info
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Vert Energy Group, Inc.', 
             splitPosition + 20, 
             height - margin * 2.95);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text('100 Spectrum Center Drive', 
             splitPosition + 20, 
             height - margin * 2.65);
    
    doc.text('Irvine, California, 92618', 
             splitPosition + 20, 
             height - margin * 2.35);
             
    doc.text('Phone: (800) 585-2680',
             splitPosition + 20,
             height - margin * 2.05);
             
    doc.text('Email: info@vertenergygroup.com',
             splitPosition + 20,
             height - margin * 1.75);
  }

  // Helper method to fetch and load image from URL
  private async fetchLogoImage(url: string): Promise<Buffer> {
    
    try {
      const axios = await import('axios');
      
      // Log request initiation
      
      const response = await axios.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout for more reliability
        headers: {
          'Accept': 'image/png,image/jpeg,image/jpg,image/*'
        }
      });
      
      // Log response information
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch logo: HTTP status ${response.status}`);
      }
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Received empty response when fetching logo');
      }
      
      const buffer = Buffer.from(response.data);
      
      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching logo from ${url}: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }
} 