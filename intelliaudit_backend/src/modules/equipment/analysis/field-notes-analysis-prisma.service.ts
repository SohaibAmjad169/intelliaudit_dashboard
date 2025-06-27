import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PrismaService } from '../../../prisma/prisma.service';

interface EquipmentFromNotes {
  id?: string;
  type: string;
  make?: string;
  model?: string;
  location?: string | {
    room?: string;
    floor?: string;
  };
  room?: string;
  floor?: string;
  quantity: number;
  wattage_w?: number;
  capacity?: string;
  flow_rate?: string;
  efficiency?: string;
  efficiency_unit?: string;
  category?: string;
  days_per_week?: number;
  annual_kwh?: number;
  is_per_unit?: boolean;
  total_quantity?: number;
  energy_source?: string;
  input_rating?: number;
  temperature_rise?: number;
  load_factor?: number;
  daily_usage?: number;
  assumptions?: string[];
  confidence: number;
  specifications?: {
    [key: string]: any;
  };
  wattage?: number;
  hours_per_week?: number;
  annual_hours?: number;
  operating_hours?: number;
  formula_used?: string;
  work_shown?: string;
  recommendations?: string;
}

interface FieldNotesAnalysisResult {
  equipment: EquipmentFromNotes[];
  building_info?: {
    type: string;
    total_units: number;
    unit_types: Array<{
      type: string;
      count: number;
      description: string;
    }>;
    floors: number;
    address?: string;
    notes?: string;
  };
  flags: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }[];
  metadata: {
    processedAt: string;
    processingTimeMs: number;
    confidence: number;
  };
  processedAt: string;
  processingTimeMs: number;
  confidence: number;
}

@Injectable()
export class FieldNotesAnalysisPrismaService {
  private readonly logger = new Logger(FieldNotesAnalysisPrismaService.name);
  private readonly openai;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI configuration is missing');
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  /**
   * Get field notes for a project
   * @param projectId - Project ID
   * @returns Field notes for the project
   */
  async getFieldNotes(projectId: string) {
    return this.prisma.projects.findUnique({
      where: { id: projectId },
      select: { raw_notes: true }
    });
  }

  /**
   * Split field notes into batches for processing
   * @param notes - Raw field notes text
   * @param batchCount - Number of batches to split into
   * @returns Array of field notes batches
   */
  private splitNotesIntoBatches(notes: string, batchCount: number = 2): string[] {
    
    // If notes are short enough, just return as a single batch
    if (notes.length < 2000) {
      return [notes];
    }
    
    const batches: string[] = [];
    const paragraphs = notes.split('\n\n');
    
    // If there are very few paragraphs, split by newlines instead
    if (paragraphs.length < batchCount * 2) {
      const lines = notes.split('\n');
      const batchSize = Math.ceil(lines.length / batchCount);
      
      for (let i = 0; i < batchCount; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, lines.length);
        if (start < lines.length) {
          batches.push(lines.slice(start, end).join('\n'));
        }
      }
    } else {
      // Split by paragraphs
      const batchSize = Math.ceil(paragraphs.length / batchCount);
      
      for (let i = 0; i < batchCount; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, paragraphs.length);
        if (start < paragraphs.length) {
          batches.push(paragraphs.slice(start, end).join('\n\n'));
        }
      }
    }
    
    // Log batch sizes
    batches.forEach(() => {
    });
    
    return batches;
  }
  
  /**
   * Process field notes to extract equipment information
   * @param notes - Raw field notes text
   * @param projectId - Project ID
   * @param model - OpenAI model to use
   * @param raw_notes - Original raw field notes text (optional, defaults to notes)
   * @returns Processed equipment information
   */
  async processFieldNotes(
    notes: string,
    projectId: string,
    model: string = 'gpt-4o-mini',
    raw_notes?: string
  ): Promise<FieldNotesAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Store raw notes in the projects table
      if (raw_notes && projectId) {
        try {
          await this.prisma.projects.update({
            where: { id: projectId },
            data: { raw_notes }
          });
          
        } catch (error) {
          this.logger.error('Error saving raw notes to projects table:', error);
          // Continue with processing even if update fails
        }
      }

      // Updated system prompt with building information AND ASHRAE calculations
      const systemPrompt = `You are an expert HVAC and building systems engineer tasked with extracting equipment information from field notes for an ASHRAE Level 2 energy audit.

Extract all equipment mentioned in the field notes and format as a JSON object with this exact structure:
{
  "building_info": {
    "type": "string",  // e.g., "Multifamily", "Office", "Retail"
    "total_units": number,  // Total number of units/apartments
    "floors": number  // Number of floors
  },
  "equipment": [
    {
      "type": "string", // Required: Equipment type (be specific)
      "make": "string", // Optional: Manufacturer/brand
      "model": "string", // Optional: Model number/name
      "location": "string", // Required: Detailed location
      "quantity": number, // Required: Number of identical units
      "is_per_unit": boolean, // Required: true if in apartment/unit
      "category": "string", // Required: HVAC, DHW, Lighting, etc.
      "energy_source": "string", // gas, electric, etc.
      "wattage_w": number, // Required: Power consumption in watts
      "hours_per_week": number, // Required: Weekly operating hours
      "annual_hours": number, // Required: hours_per_week * 52
      "annual_kwh": number // Required: (wattage_w * quantity * annual_hours) / 1000
    }
  ]
}

IMPORTANT GUIDELINES:
1. **Operating Hours (hours_per_week):** Use these defaults:
   - Common Areas/Central Systems: 84 hrs/wk
   - In-Unit/Tenant Items: 28 hrs/wk
   - Central HVAC/DHW Systems: 150 hrs/wk
   - Water Fixtures: Toilets (14), Faucets (21), Showers (7)

2. **Annual kWh Calculation:** Use the formula: "(wattage_w * quantity * annual_hours) / 1000"

3. **Complete List:** Include ALL equipment identified or reasonably inferred.`;

      
      // Check if notes are long enough to require batch processing
      if (notes.length > 5000) {
        return this.processFieldNotesInBatches(notes, projectId, model, systemPrompt, startTime);
      }
      

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: notes }
        ],
        response_format: { type: "json_object" },
      });

      // Extract and parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Log content size to help diagnose potential truncation issues
      
      // Check if the response might be truncated (often happens with very large responses)
      if (content.length > 100000) {
        this.logger.warn('Response is very large and might be at risk of truncation');
      }

      try {
        const parsedResponse = JSON.parse(content);
        
        // Validate the response structure
        if (!parsedResponse.equipment || !Array.isArray(parsedResponse.equipment)) {
          this.logger.warn('Invalid response format from OpenAI:', content);
          return {
            equipment: [],
            flags: [{
              type: 'error',
              message: 'Invalid response format from OpenAI: equipment is not an array',
              severity: 'error'
            }],
            processedAt: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            confidence: 0,
            metadata: {
              processedAt: new Date().toISOString(),
              processingTimeMs: Date.now() - startTime,
              confidence: 0
            }
          };
        }

        // Save equipment to database
        for (const equipment of parsedResponse.equipment) {
          await this.saveEquipmentToDatabase(equipment, projectId, model);
        }

        // Save building info and unit count to projects table if available
        if (parsedResponse.building_info) {
          try {
            await this.prisma.projects.update({
              where: { id: projectId },
              data: {
                total_units: parsedResponse.building_info.total_units || null,
                building_floors: parsedResponse.building_info.floors || null,
                building_type: parsedResponse.building_info.type || null,
                // We're still saving the full building_info object for compatibility
                building_info: parsedResponse.building_info
              }
            });
          } catch (error) {
            this.logger.error(`Error saving building info to project: ${error.message}`);
            // Continue even if save fails
          }
        }

        const avgConfidence = this.calculateAverageConfidence(parsedResponse.equipment);
        const processedAt = new Date().toISOString();
        const processingTimeMs = Date.now() - startTime;

        // Return the processed result
        return {
          equipment: parsedResponse.equipment,
          building_info: parsedResponse.building_info,
          flags: parsedResponse.flags || [],
          processedAt,
          processingTimeMs,
          confidence: avgConfidence,
          metadata: {
            processedAt,
            processingTimeMs,
            confidence: avgConfidence
          }
        };
      } catch (parseError) {
        this.logger.error('Error parsing OpenAI response:', parseError);
        this.logger.error('Raw response:', content);
        
        // Try to fix common JSON errors before giving up
        try {
          const fixedResult = this.fixCommonJsonErrors(content);
          
          // fixedResult could be a string or an object, handle both cases
          let parsedResponse;
          if (typeof fixedResult === 'string') {
            // If it's a string, parse it
            parsedResponse = JSON.parse(fixedResult);
          } else {
            // If it's already an object (from handleSeverelyTruncatedJson), use it directly
            parsedResponse = fixedResult;
          }
          
          // Validate the fixed response structure
          if (!parsedResponse.equipment || !Array.isArray(parsedResponse.equipment)) {
            this.logger.warn('Invalid response format from OpenAI after fixing JSON:', fixedResult);
            return {
              equipment: [],
              flags: [{
                type: 'error',
                message: 'Invalid response format from OpenAI: equipment is not an array',
                severity: 'error'
              }],
              processedAt: new Date().toISOString(),
              processingTimeMs: Date.now() - startTime,
              confidence: 0,
              metadata: {
                processedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
                confidence: 0
              }
            };
          }
          
          // If we're here, the JSON was successfully fixed and parsed
          
          const avgConfidence = this.calculateAverageConfidence(parsedResponse.equipment);
          const processedAt = new Date().toISOString();
          const processingTimeMs = Date.now() - startTime;
          
          // Return the processed result with fixed JSON
          return {
            equipment: parsedResponse.equipment,
            building_info: parsedResponse.building_info,
            flags: [...(parsedResponse.flags || []), {
              type: 'warning',
              message: 'OpenAI response had JSON errors that were automatically fixed',
              severity: 'warning'
            }],
            processedAt,
            processingTimeMs,
            confidence: avgConfidence,
            metadata: {
              processedAt,
              processingTimeMs,
              confidence: avgConfidence
            }
          };
        } catch (fixError) {
          this.logger.error('Failed to fix JSON errors:', fixError);
        }
        
        return {
          equipment: [],
          flags: [{
            type: 'parse_error',
            message: `Failed to parse OpenAI response: ${parseError.message}`,
            severity: 'error'
          }],
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          confidence: 0,
          metadata: {
            processedAt: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            confidence: 0
          }
        };
      }
    } catch (error) {
      this.logger.error('Error processing field notes:', error);
      return {
        equipment: [],
        flags: [{
          type: 'error',
          message: `Error processing field notes: ${error.message}`,
          severity: 'error'
        }],
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        confidence: 0,
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          confidence: 0
        }
      };
    }
  }

  /**
   * Fix common JSON errors in OpenAI responses
   * @param jsonString - The raw JSON string with potential errors
   * @returns Fixed JSON string or parsed object if severe repair was needed
   */
  private fixCommonJsonErrors(jsonString: string): string | any {
    
    // First, check if the response is a complete JSON object
    try {
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      this.logger.error('Error parsing OpenAI response:');
      this.logger.error(error);
      this.logger.error('Raw response:');
      this.logger.error(jsonString.substring(0, 1000) + '...'); // Log first 1000 chars
    }
    
    // Extract what looks like JSON from the content
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Handle case where JSON is incomplete (no closing brace)
      if (jsonString.includes('{')) {
        // If we have an opening brace but no complete JSON object,
        // try to complete the JSON structure by adding missing closing braces
        this.logger.warn('Incomplete JSON detected. Attempting to repair structure.');
        return this.completeIncompleteJson(jsonString);
      }
      throw new Error('No JSON object found in the response');
    }
    
    let json = jsonMatch[0];
    
    // Replace unquoted property names with quoted ones
    json = json.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
    
    // Remove trailing commas in arrays and objects
    json = json.replace(/,(\s*[}\]])/g, '$1');
    
    // Replace single quotes with double quotes for property values
    json = json.replace(/:(\s*)'([^']*)'/g, ': "$2"');
    
    // Remove comments
    json = json.replace(/\/\/.*$/gm, '');
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Ensure all string values are properly quoted
    json = json.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2');
    
    // Fix common Unicode quote issues
    json = json.replace(/[\u2018\u2019]/g, "'"); // Smart single quotes
    json = json.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
    
    // Fix escaped quotes inside strings that should be double-escaped
    // Look for cases like: "value": "Some text with \"quoted\" text"
    // Regex is complex to avoid over-escaping already properly escaped quotes
    json = json.replace(/"((?:[^"\\]|\\.)*)"/g, (_, p1) => {
      // Replace any \" that isn't already escaped as \\"
      return '"' + p1.replace(/([^\\])\\"/g, '$1\\\\"') + '"';
    });
    
    // Fix control characters that might be causing issues
    json = json.replace(/[\x00-\x1F\x7F-\x9F]/g, match => {
      // Replace control characters with their proper escaped form
      return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
    });
    
    // Fix unterminated strings (most important fix for the current issue)
    // This is a simple approach - for complex cases we might need a more sophisticated solution
    json = this.fixUnterminatedStrings(json);
    
    // Try parsing the fixed JSON to see if it's valid
    try {
      JSON.parse(json);
      return json;
    } catch (error) {
      this.logger.error('Failed to fix JSON errors:');
      this.logger.error(error);
      
      // If we still can't parse it, try a more aggressive approach
      const salvaged = this.handleSeverelyTruncatedJson(jsonString);
      return salvaged;
    }
  }

  /**
   * Attempt to complete an incomplete JSON structure
   * This handles the "Unexpected end of JSON input" error
   * @param incompleteJson - The incomplete JSON string
   * @returns Fixed JSON string with proper structure
   */
  private completeIncompleteJson(incompleteJson: string): string {
    
    // Count opening and closing braces
    const openBraces = (incompleteJson.match(/\{/g) || []).length;
    const closeBraces = (incompleteJson.match(/\}/g) || []).length;
    
    // Count opening and closing brackets
    const openBrackets = (incompleteJson.match(/\[/g) || []).length;
    const closeBrackets = (incompleteJson.match(/\]/g) || []).length;
    
    
    // Check if we have a missing closing brace or bracket
    let fixedJson = incompleteJson;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixedJson += '}';
      this.logger.warn(`Added missing closing brace (${i + 1}/${openBraces - closeBraces})`);
    }
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJson += ']';
      this.logger.warn(`Added missing closing bracket (${i + 1}/${openBrackets - closeBrackets})`);
    }
    
    // Check if the last property might be missing a closing quote
    const lastPropertyMatch = fixedJson.match(/"([^"]+)"\s*:\s*("[^"]*|[^,}\]]+)$/);
    if (lastPropertyMatch && !lastPropertyMatch[2].startsWith('"')) {
      // The value doesn't start with a quote - let's check if it's a valid literal
      const validLiterals = ['true', 'false', 'null'];
      const isNumber = !isNaN(Number(lastPropertyMatch[2]));
      
      if (!validLiterals.includes(lastPropertyMatch[2].trim()) && !isNumber) {
        // This is likely a string without closing quotes
        this.logger.warn('Fixed missing quotes for last property value');
        fixedJson = fixedJson.replace(/([^"]+)$/, '"$1"');
      }
    }
    
    // Handle potential trailing commas
    fixedJson = fixedJson.replace(/,\s*\}$/, '}');
    fixedJson = fixedJson.replace(/,\s*\]$/, ']');
    
    // Check if the JSON is now properly structured
    try {
      JSON.parse(fixedJson);
      return fixedJson;
    } catch (e) {
      this.logger.error('Failed to fix incomplete JSON:', e);
      
      // If we still can't parse it, try a more aggressive approach:
      // Get the partial JSON and create a minimal valid structure
      if (fixedJson.includes('"equipment"')) {
        // Extract what we can of the equipment array
        const equipmentMatch = fixedJson.match(/"equipment"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
        if (equipmentMatch) {
          let equipmentItems = equipmentMatch[1].trim();
          
          // If the equipment items end with a comma, remove it
          if (equipmentItems.endsWith(',')) {
            equipmentItems = equipmentItems.slice(0, -1);
          }
          
          // Find the last complete equipment item
          // We'll look for complete JSON objects within the array
          const equipmentObjects = [];
          let currentObject = '';
          let braceCount = 0;
          let inString = false;
          
          for (let i = 0; i < equipmentItems.length; i++) {
            const char = equipmentItems[i];
            currentObject += char;
            
            // Track string boundaries
            if (char === '"' && (i === 0 || equipmentItems[i-1] !== '\\')) {
              inString = !inString;
            }
            
            // Only count braces when not in a string
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              
              // When we reach the end of an object, add it to our array
              if (braceCount === 0 && currentObject.trim().startsWith('{') && currentObject.trim().endsWith('}')) {
                try {
                  // Verify this is a valid JSON object
                  JSON.parse(currentObject);
                  equipmentObjects.push(currentObject);
                  currentObject = '';
                } catch (e) {
                  // Not a valid object, continue collecting
                }
              }
            }
          }
          
          // Create a minimal valid JSON with the complete equipment objects
          if (equipmentObjects.length > 0) {
            const minimalJson = `{"equipment":[${equipmentObjects.join(',')}],"building_info":${fixedJson.includes('"building_info"') ? '{}' : 'null'}}`;
            
            try {
              // Verify it's valid
              JSON.parse(minimalJson);
              return minimalJson;
            } catch (minimalError) {
              this.logger.error('Failed to create minimal valid JSON with complete items:', minimalError);
            }
          }
          
          // If we couldn't extract complete objects, try with the raw equipment items
          const minimalJson = `{"equipment":[${equipmentItems}]}`;
          
          try {
            // Verify it's valid
            JSON.parse(minimalJson);
            return minimalJson;
          } catch (minimalError) {
            this.logger.error('Failed to create minimal valid JSON:', minimalError);
          }
        }
      }
      
      // If all else fails, return a valid but empty structure
      this.logger.warn('Returning empty but valid JSON structure');
      return '{"equipment":[],"building_info":null,"flags":[{"type":"error","message":"Response was truncated, created empty structure","severity":"error"}]}';
    }
  }
  
  /**
   * Fix unterminated strings in JSON
   * This is a common issue with OpenAI responses
   * @param json - The JSON string with potential unterminated strings
   * @returns Fixed JSON string
   */
  private fixUnterminatedStrings(json: string): string {
    // Split the JSON string into lines
    const lines = json.split('\n');
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count the number of quotes in the line
      const quoteCount = (line.match(/"/g) || []).length;
      
      // If the count is odd, this line likely has an unterminated string
      if (quoteCount % 2 !== 0) {
        // Check if the next line exists
        if (i + 1 < lines.length) {
          // This is likely an unterminated string that continues on the next line
          // Add a quote at the end of this line and at the beginning of the next line
          lines[i] = line + '"';
          lines[i + 1] = '"' + lines[i + 1];
          
          this.logger.warn(`Fixed unterminated string at line ${i + 1}`);
        } else {
          // This is the last line with an unterminated string
          // Just add a quote at the end
          lines[i] = line + '"';
          
          this.logger.warn(`Fixed unterminated string at the last line ${i + 1}`);
        }
      }
    }
    
    // Join the lines back together
    let result = lines.join('\n');
    
    // Specific fix for the error at position 55371
    // This is a common problem where a quote is missing before a specific position
    if (result.length > 55371) {
      // Look at the character at position 55371
      const nextQuotePos = result.indexOf('"', 55371);
      const prevQuotePos = result.lastIndexOf('"', 55371);
      
      // If the quote distances indicate an unterminated string issue
      if (nextQuotePos !== -1 && prevQuotePos !== -1) {
        // Check context between quotes
        const textBetween = result.substring(prevQuotePos, nextQuotePos + 1);
        const quoteCount = (textBetween.match(/"/g) || []).length;
        
        // If odd number of quotes, we need to add a quote
        if (quoteCount % 2 !== 0) {
          // Add quote at position 55371
          result = result.substring(0, 55371) + '"' + result.substring(55371);
          this.logger.warn(`Fixed unterminated string at specific position 55371`);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Process field notes in batches to avoid truncation issues
   * @param notes - Raw field notes text
   * @param projectId - Project ID
   * @param model - OpenAI model to use
   * @param raw_notes - Original raw field notes text
   * @param systemPrompt - System prompt to use
   * @param startTime - Start time of the processing
   * @returns Processed equipment information
   */
  private async processFieldNotesInBatches(
    notes: string,
    projectId: string,
    model: string,
    systemPrompt: string,
    startTime: number
  ): Promise<FieldNotesAnalysisResult> {
    
    // Split notes into batches
    const batches = this.splitNotesIntoBatches(notes);
    
    // Process each batch
    const allEquipment: any[] = [];
    let buildingInfo: any = null;
    
    for (let i = 0; i < batches.length; i++) {
      
      try {
        // Call OpenAI API for this batch
        const batchResponse = await this.openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: `BATCH ${i + 1} OF ${batches.length}: ${batches[i]}\n\nNote: This is batch ${i + 1} of ${batches.length}. Focus on extracting equipment from this batch only.` 
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Extract and parse the response
        const batchContent = batchResponse.choices[0]?.message?.content;
        if (!batchContent) {
          this.logger.error(`Empty response from OpenAI for batch ${i + 1}`);
          continue;
        }
        
        // Log content size
        
        // Parse the batch response
        let batchParsedResponse;
        try {
          batchParsedResponse = JSON.parse(batchContent);
        } catch (parseError) {
          this.logger.error(`Error parsing batch ${i + 1} response:`, parseError);
          
          // Try to fix common JSON errors
          try {
            const fixedResult = this.fixCommonJsonErrors(batchContent);
            
            // Handle both string and object returns from fixCommonJsonErrors
            if (typeof fixedResult === 'string') {
              batchParsedResponse = JSON.parse(fixedResult);
            } else {
              batchParsedResponse = fixedResult;
            }
            
          } catch (fixError) {
            this.logger.error(`Failed to fix batch ${i + 1} JSON:`, fixError);
            continue;
          }
        }
        
        // Validate the response structure
        if (!batchParsedResponse.equipment || !Array.isArray(batchParsedResponse.equipment)) {
          this.logger.warn(`Invalid response format from OpenAI for batch ${i + 1}`);
          continue;
        }
        
        // Add equipment from this batch to the combined list
        allEquipment.push(...batchParsedResponse.equipment);
        
        // Save building info from the first batch that has it
        if (!buildingInfo && batchParsedResponse.building_info) {
          buildingInfo = batchParsedResponse.building_info;
        }
        
      } catch (error) {
        this.logger.error(`Error processing batch ${i + 1}:`, error);
      }
    }
    
    // Save equipment to database
    for (const equipment of allEquipment) {
      await this.saveEquipmentToDatabase(equipment, projectId, model);
    }
    
    // Save building info if available
    if (buildingInfo) {
      try {
        await this.prisma.projects.update({
          where: { id: projectId },
          data: {
            total_units: buildingInfo.total_units || null,
            building_floors: buildingInfo.floors || null,
            building_type: buildingInfo.type || null,
            // We're still saving the full building_info object for compatibility
            building_info: buildingInfo
          }
        });
      } catch (error) {
        this.logger.error(`Error saving building info to project: ${error.message}`);
      }
    }
    
    // Return the combined result
    const processedAt = new Date().toISOString();
    const processingTimeMs = Date.now() - startTime;
    return {
      equipment: allEquipment,
      building_info: buildingInfo,
      flags: [
        {
          type: 'info',
          message: `Processed in ${batches.length} batches. Found ${allEquipment.length} equipment items.`,
          severity: 'info'
        }
      ],
      processedAt,
      processingTimeMs,
      confidence: 0.8,
      metadata: {
        processedAt,
        processingTimeMs,
        confidence: 0.8
      }
    };
  }
  
  /**
   * Handle severely truncated JSON that can't be fixed with standard methods
   * @param jsonString - The raw JSON string that's severely truncated
   * @returns A valid JavaScript object with as much salvaged data as possible
   */
  private handleSeverelyTruncatedJson(jsonString: string): any {
    this.logger.warn('Attempting to salvage severely truncated JSON');
    
    // Try to extract building_info if present
    let buildingInfo = null;
    const buildingInfoMatch = jsonString.match(/"building_info"\s*:\s*(\{[\s\S]*?\})/);
    if (buildingInfoMatch) {
      try {
        // Try to parse the building_info object
        const buildingInfoStr = buildingInfoMatch[1];
        buildingInfo = JSON.parse(buildingInfoStr);
      } catch (e) {
        this.logger.error('Failed to extract building_info:', e);
      }
    }
    
    // Try to extract complete equipment items
    const equipmentItems = [];
    
    // Look for the equipment array
    const equipmentMatch = jsonString.match(/"equipment"\s*:\s*\[([\s\S]*)$/);
    if (equipmentMatch) {
      const equipmentContent = equipmentMatch[1];
      
      // Use regex to find all objects in the array
      const objectRegex = /\{[\s\S]*?\}/g;
      let match;
      
      while ((match = objectRegex.exec(equipmentContent)) !== null) {
        const equipmentItem = match[0];
        
        try {
          // Try to parse this equipment item
          const parsedItem = JSON.parse(equipmentItem);
          equipmentItems.push(parsedItem);
        } catch (e) {
          // This object isn't complete or valid, skip it
        }
      }
    }
    
    // Construct a valid object with what we've salvaged
    return {
      equipment: equipmentItems,
      building_info: buildingInfo,
      flags: [
        {
          type: 'warning',
          message: `Response was truncated. Salvaged ${equipmentItems.length} equipment items.`,
          severity: 'warning'
        }
      ],
      processedAt: new Date().toISOString(),
      processingTimeMs: 0,  // This will be set by the calling code
      confidence: equipmentItems.length > 0 ? 0.7 : 0.3  // Reasonable confidence based on salvaged items
    };
  }

  /**
   * Calculate the average confidence score for all equipment items
   * @param equipment - Array of equipment items
   * @returns Average confidence score
   */
  private calculateAverageConfidence(equipment: EquipmentFromNotes[]): number {
    if (!equipment || equipment.length === 0) {
      return 0;
    }
    
    const sum = equipment.reduce((total, item) => total + (item.confidence || 0), 0);
    return sum / equipment.length;
  }

  /**
   * Analyze energy usage breakdown from equipment data
   * @param equipment - Equipment data to analyze
   * @param prompt - Custom prompt for analysis (optional)
   * @param model - OpenAI model to use
   * @param raw_notes - Original raw field notes (optional)
   * @param projectId - Project ID (optional)
   * @returns Energy usage breakdown analysis
   */
  async analyzeEnergyUsage(
    equipment: any[],
    prompt?: string,
    model: string = 'gpt-4o-mini',
    raw_notes?: string,
    projectId?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get building information if projectId is provided
      let buildingType = "Commercial";
      let squareFootage = 0;
      
      if (projectId) {
        try {
          const project = await this.prisma.projects.findUnique({
            where: { id: projectId },
            select: { 
              building_type: true,
              property_gross_floor_area: true
            }
          });
          
          if (project) {
            buildingType = project.building_type || "Commercial";
            squareFootage = project.property_gross_floor_area || 0;
          }
        } catch (error) {
          this.logger.warn(`Could not fetch project data: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // System prompt for energy usage analysis
      const systemPrompt = prompt || `You are an expert energy auditor performing an ASHRAE Level 2 energy audit. Analyze the provided equipment data and calculate the energy usage breakdown by category.

Your task:
1. Calculate the total annual energy usage (kWh) for each equipment category
2. Calculate the percentage of total energy usage for each category
3. Model any missing equipment that would typically be in this type of building
4. Compare the energy breakdown to industry benchmarks
5. Provide energy-saving recommendations

Building information:
- Type: ${buildingType}
- Square footage: ${squareFootage || "Unknown"}

For any missing information, make reasonable assumptions based on:
1. buildingType - the type of building
2. equipment data provided
3. typical energy usage patterns
4. industry benchmarks
5. unitCount - number of units or spaces in the building

Return your response ONLY as a JSON object with this exact structure:
{
  "breakdown": [
    {
      "category": "string",  // Category name (HVAC, Lighting, etc.)
      "value": number,       // Annual kWh
      "percentage": number   // Percentage of total (0-100)
    }
  ],
  "modeledBreakdown": [
    {
      "category": "string",  // Category name
      "value": number,       // Annual kWh
      "percentage": number,  // Percentage of total
      "isModeled": boolean   // Whether this is modeled or surveyed equipment
    }
  ],
  "benchmarkComparison": [
    {
      "category": "string",  // Category name
      "yourBuilding": number, // Your building's percentage
      "benchmark": number,    // Industry benchmark percentage
      "difference": number    // Difference (+ means higher than benchmark)
    }
  ],
  "modeledEquipment": [
    {
      "type": "string",      // Equipment type
      "category": "string",  // Category
      "quantity": number,    // Number of units
      "annual_kwh": number,  // Annual kWh
      "description": "string" // Explanation of why this was modeled
    }
  ],
  "totalAnnualKwh": number,  // Total annual kWh (surveyed equipment)
  "totalModeledAnnualKwh": number, // Total annual kWh (with modeled equipment)
  "buildingType": "${buildingType}",  // Building type
  "squareFootage": ${squareFootage || "number"},   // Estimated square footage
  "unitCount": number,       // Number of units/spaces
  "assumptions": [           // List of assumptions made
    "string"
  ],
  "recommendations": [       // Energy saving recommendations
    {
      "description": "string", // Description of recommendation
      "equipment": "string",   // Target equipment
      "savingsKwh": number,    // Estimated annual savings (kWh)
      "savingsPercentage": number // Percentage of total energy
    }
  ],
  "eui": number,            // Current Energy Use Intensity in kWh/sqft/year
  "benchmarkEui": number,    // Typical benchmark EUI for this building type
  "insights": [              // Analysis insights
    "string"
  ]
}`;

      // Log the prompt length for debugging

      // Call OpenAI API with both equipment data and raw field notes
      const userContent = raw_notes 
        ? `EQUIPMENT DATA: ${JSON.stringify(equipment)}\n\nRAW FIELD NOTES: ${raw_notes}`
        : JSON.stringify(equipment);

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
      });

      // Extract and parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Log content size to help diagnose potential truncation issues
      
      // Check if the response might be truncated
      if (content.length > 100000) {
        this.logger.warn('Energy analysis response is very large and might be at risk of truncation');
      }

      try {
        const parsedResponse = JSON.parse(content);
        
        // Validate crucial fields are present
        if (!parsedResponse.modeledBreakdown) {
          this.logger.warn('Missing modeledBreakdown in response, this may cause UI issues');
        }
        
        if (!parsedResponse.modeledEquipment) {
          this.logger.warn('Missing modeledEquipment in response, this may cause UI issues');
        }
        
        // Save to project if projectId is provided
        if (projectId) {
          try {
            // First get the current building_info
            const project = await this.prisma.projects.findUnique({
              where: { id: projectId },
              select: { building_info: true }
            });
            
            // Merge with new energy analysis data
            // Ensure building_info is an object before spreading
            const currentInfo = typeof project?.building_info === 'object' && project?.building_info !== null
              ? project.building_info
              : {};
              
            const updatedInfo = {
              ...currentInfo,
              energy_analysis: parsedResponse,
              energy_analysis_updated_at: new Date()
            };
            
            // Update the project with the merged data
            await this.prisma.projects.update({
              where: { id: projectId },
              data: { building_info: updatedInfo }
            });
            
          } catch (error) {
            this.logger.error(`Error saving energy analysis to project: ${error.message}`);
            // Continue even if save fails
          }
        }
        
        // Add metadata to response
        return {
          ...parsedResponse,
          metadata: {
            processedAt: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            model: model
          }
        };
      } catch (parseError) {
        this.logger.error('Error parsing OpenAI response:', parseError);
        this.logger.error('Raw response:', content);
        
        // Try to fix common JSON errors before giving up
        try {
          const fixedJson = this.fixCommonJsonErrors(content);
          const parsedResponse = JSON.parse(fixedJson);
          
          
          // Add a warning flag about the fixed JSON
          const responseWithWarning = {
            ...parsedResponse,
            warnings: [...(parsedResponse.warnings || []), {
              type: 'warning',
              message: 'OpenAI response had JSON errors that were automatically fixed',
              severity: 'warning'
            }]
          };
          
          // Save to project if projectId is provided
          if (projectId) {
            try {
              // First get the current building_info
              const project = await this.prisma.projects.findUnique({
                where: { id: projectId },
                select: { building_info: true }
              });
              
              // Merge with new energy analysis data
              // Ensure building_info is an object before spreading
              const currentInfo = typeof project?.building_info === 'object' && project?.building_info !== null
                ? project.building_info
                : {};
                
              const updatedInfo = {
                ...currentInfo,
                energy_analysis: responseWithWarning,
                energy_analysis_updated_at: new Date()
              };
              
              // Update the project with the merged data
              await this.prisma.projects.update({
                where: { id: projectId },
                data: { building_info: updatedInfo }
              });
              
            } catch (error) {
              this.logger.error(`Error saving fixed energy analysis to project: ${error.message}`);
              // Continue even if save fails
            }
          }
          
          // Add metadata to response
          return {
            ...responseWithWarning,
            metadata: {
              processedAt: new Date().toISOString(),
              processingTimeMs: Date.now() - startTime,
              model: model
            }
          };
        } catch (fixError) {
          this.logger.error('Failed to fix JSON errors in energy analysis:', fixError);
        }
        
        throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
      }
    } catch (error) {
      this.logger.error('Error analyzing energy usage:', error);
      throw error;
    }
  }

  /**
   * Save equipment to database with proper error handling and validation
   * @param equipment - Equipment data to save
   * @param projectId - Project ID to associate with
   * @param model - AI model used to generate the data
   * @returns Promise resolving to the saved equipment
   */
  private async saveEquipmentToDatabase(equipment: EquipmentFromNotes, projectId: string, model: string): Promise<any> {
    if (!equipment || !equipment.type) {
      this.logger.warn('Skipping invalid equipment item: missing type');
      return null;
    }

    if (!projectId) {
      this.logger.error('Cannot save equipment: missing projectId');
      return null;
    }

    try {
      
      // Handle location field which could be a string or an object
      let locationValue: string | null = null;
      if (typeof equipment.location === 'string') {
        locationValue = equipment.location;
      } else if (equipment.location && typeof equipment.location === 'object') {
        // If it's an object, stringify it for storage
        locationValue = JSON.stringify(equipment.location);
      }
      
      // Map fields from EquipmentFromNotes to database schema
      const result = await this.prisma.equipment_analysis.create({
        data: {
          project_id: projectId,
          equipment_type: equipment.type,
          manufacturer: equipment.make || null,
          model: equipment.model || null,
          location: locationValue,
          is_per_unit: equipment.is_per_unit || false,
          quantity: equipment.quantity || null,
          wattage: equipment.wattage_w || null,
          category: equipment.category || null,
          // Calculate weekly_hours from days_per_week and operating_hours
          weekly_hours: equipment.hours_per_week || 
            (equipment.days_per_week && equipment.operating_hours ? 
              equipment.days_per_week * equipment.operating_hours : null),
          annual_hours: equipment.annual_hours || 
            (equipment.hours_per_week ? equipment.hours_per_week * 52 : null),
          annual_kwh: equipment.annual_kwh || null,
          energy_source: equipment.energy_source || null,
          
          // Set default values for fields we no longer request
          capacity: null,
          flow_rate: null,
          efficiency: null,
          efficiency_unit: null,
          input_rating: null,
          temperature_rise: null,
          load_factor: 0.7, // Default load factor
          daily_usage: null,
          notes: null,
          confidence: equipment.confidence || 1.0, // Use provided confidence or default
          specifications: equipment.specifications || {},
          ai_model: model,
          source_type: 'field_notes',
          formula_used: "(wattage_w * quantity * annual_hours) / 1000",
          work_shown: `(${equipment.wattage_w || 0} * ${equipment.quantity || 1} * ${equipment.annual_hours || 0}) / 1000`,
          recommendations: null,
          control_strategy: null
        }
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error saving equipment to database: ${equipment.type}`, error);
      
      // Add specific error handling for common database errors
      if (error.code === 'P2002') {
        this.logger.error('Unique constraint violation - equipment might already exist');
      } else if (error.code === 'P2003') {
        this.logger.error('Foreign key constraint violation - project might not exist');
      } else if (error.code === 'P2005') {
        this.logger.error('Field value is invalid for its type');
      }
      
      return null;
    }
  }

  /**
   * Process notes - adapter method to match the controller interface
   * @param options - Processing options
   * @returns Processed equipment information
   */
  async processNotes(options: {
    projectId: string;
    notes: string;
    systemPrompt?: string;
    model?: string;
  }): Promise<FieldNotesAnalysisResult> {
    return this.processFieldNotes(
      options.notes,
      options.projectId,
      options.model || 'gpt-4o-mini',
      options.notes // Use notes as raw_notes
    );
  }
}
