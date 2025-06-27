import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportTemplateService {
  private readonly templatesDirs: string[];

  constructor() {
    // In development mode, load templates from src directory
    // In production mode, load templates from dist directory
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // In development mode, prioritize src directory
      this.templatesDirs = [
        path.join(process.cwd(), 'src', 'modules', 'reports', 'templates'),
        path.join(__dirname, '..', 'templates'),
        path.join(process.cwd(), 'dist', 'modules', 'reports', 'templates')
      ];
    } else {
      // In production mode, prioritize dist directory
      this.templatesDirs = [
        path.join(__dirname, '..', 'templates'),
        path.join(process.cwd(), 'dist', 'modules', 'reports', 'templates'),
        path.join(process.cwd(), 'src', 'modules', 'reports', 'templates')
      ];
    }

    this.registerHelpers();
    this.registerPartials();
  }

  /**
   * Register Handlebars helpers for formatting and conditional logic
   */
  private registerHelpers(): void {
    // Format number with commas
    Handlebars.registerHelper('formatNumber', (num: number, decimals = 0) => {
      if (num === null || num === undefined) return '0';
      // Ensure decimals is a valid number between 0 and 20
      const validDecimals = Math.min(Math.max(0, Number(decimals) || 0), 20);
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: validDecimals,
        maximumFractionDigits: validDecimals
      }).format(num);
    });

    // Format currency
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      if (amount === null || amount === undefined || isNaN(Number(amount))) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(amount));
    });

    // Extract street name from address
    Handlebars.registerHelper('streetName', (address: string) => {
      if (!address) return '';
      const parts = address.split(',')[0].trim().split(' ');
      if (parts.length < 2) return address;
      
      // First part is usually the street number
      const streetNumber = parts[0];
      
      // Rest is the street name, possibly with some suffixes to filter
      const suffixesToRemove = ['Blvd', 'Blvd.', 'Boulevard', 'Rd', 'Rd.', 'Road', 'St', 'St.', 'Street', 'Ave', 'Ave.', 'Avenue', 'Dr', 'Dr.', 'Drive'];
      const streetParts = parts.slice(1).filter(part => !suffixesToRemove.includes(part));
      
      // Return the number and filtered street name
      return streetNumber + ' ' + (streetParts.length > 0 ? streetParts.join(' ') : parts.slice(1).join(' '));
    });

    // Add helper
    Handlebars.registerHelper('add', (a, b) => {
      return Number(a) + Number(b);
    });

    // Conditional helper
    Handlebars.registerHelper('ifCond', function(this: any, v1: any, operator: string, v2: any, options: any) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&': return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||': return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    });
  }

  /**
   * Register Handlebars partials for reusable components
   */
  private async registerPartials(): Promise<void> {
    try {
      // Register each partial template
      const partialNames = ['executive-summary', 'energy-audit', 'water-audit', 'retro-commissioning', 'appendices'];

      for (const partialName of partialNames) {
        try {
          const partialContent = await this.loadTemplate(partialName);
          Handlebars.registerPartial(partialName, partialContent);
          console.log(`Registered partial: ${partialName}`);
        } catch (error) {
          console.error(`Error loading partial ${partialName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error registering partials:', error);
    }
  }

  /**
   * Load a template file
   * @param templateName Name of the template file
   * @returns Template content as string
   */
  private async loadTemplate(templateName: string): Promise<string> {
    // Try each template directory until we find the file
    for (const dir of this.templatesDirs) {
      const templatePath = path.join(dir, `${templateName}.hbs`);
      try {
        // Check if file exists
        await fs.promises.access(templatePath, fs.constants.F_OK);
        // If it exists, read and return it
        return await fs.promises.readFile(templatePath, 'utf8');
      } catch (error) {
        // File doesn't exist in this directory, try the next one
        console.log(`Template not found at ${templatePath}, trying next directory...`);
      }
    }

    // If we get here, the template wasn't found in any directory
    throw new Error(`Template '${templateName}.hbs' not found in any template directory`);
  }

  /**
   * Compile a template with data
   * @param templateName Name of the template file
   * @param data Data to fill the template with
   * @returns Compiled HTML string
   */
  async compileTemplate(templateName: string, data: any): Promise<string> {
    const templateContent = await this.loadTemplate(templateName);
    const template = Handlebars.compile(templateContent);
    return template(data);
  }

  /**
   * Generate a PDF from HTML content
   * @param htmlContent HTML content to convert to PDF
   * @returns PDF as Buffer
   */
  async generatePdf(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true as any,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Set PDF options
    const pdfOptions: puppeteer.PDFOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; margin-top: 5px;"></div>',
      footerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; margin-bottom: 5px;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    };

    const pdf = await page.pdf(pdfOptions);
    await browser.close();

    return Buffer.from(pdf);
  }

  /**
   * Generate a complete report PDF
   * @param projectId Project ID to generate report for
   * @param data Report data
   * @returns PDF as Buffer
   */
  async generateReport(_projectId: string, data: any): Promise<Buffer> {
    // Compile the main template with all sections
    const htmlContent = await this.compileTemplate('full-report', data);

    // Generate PDF from the compiled HTML
    return this.generatePdf(htmlContent);
  }
}
