import { EquipmentItemDto, FlagDto, MetadataDto, BuildingInfoDto } from '../dto/field-notes-response.dto';

/**
 * Field Notes domain model for business logic
 */
export class FieldNotesModel {
  public id?: string;
  public notes: string;
  public projectId: string;
  public model: string;
  public equipment: EquipmentItemDto[] = [];
  public flags: FlagDto[] = [];
  public metadata: MetadataDto;
  public buildingInfo?: BuildingInfoDto;
  
  constructor(data: {
    notes: string;
    projectId: string;
    model?: string;
    id?: string;
  }) {
    this.notes = data.notes;
    this.projectId = data.projectId;
    this.model = data.model || 'o1';
    this.id = data.id;
    
    // Initialize metadata
    this.metadata = {
      processedAt: new Date().toISOString(),
      processingTimeMs: 0,
      confidence: 0
    };
  }
  
  /**
   * Validates that the model has required fields
   * @throws Error if validation fails
   */
  validate(): void {
    if (!this.notes || this.notes.trim().length === 0) {
      throw new Error('Field notes cannot be empty');
    }
    
    if (!this.projectId) {
      throw new Error('Project ID is required');
    }
    
    // Validate model is one of the allowed values
    const allowedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1'];
    if (!allowedModels.includes(this.model)) {
      throw new Error(`AI model must be one of: ${allowedModels.join(', ')}`);
    }
  }
  
  /**
   * Adds equipment to the model
   * @param equipment Equipment items to add
   */
  addEquipment(equipment: EquipmentItemDto[]): void {
    this.equipment = [...this.equipment, ...equipment];
  }
  
  /**
   * Adds a flag to the model
   * @param flag Flag to add
   */
  addFlag(flag: FlagDto): void {
    this.flags.push(flag);
  }
  
  /**
   * Updates metadata for the model
   * @param metadata Metadata to update
   */
  updateMetadata(metadata: Partial<MetadataDto>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
  }
  
  /**
   * Sets building information
   * @param buildingInfo Building information
   */
  setBuildingInfo(buildingInfo: BuildingInfoDto): void {
    this.buildingInfo = buildingInfo;
  }
  
  /**
   * Calculates confidence score based on equipment data quality
   * @returns Confidence score between 0 and 1
   */
  calculateConfidence(): number {
    if (this.equipment.length === 0) {
      return 0;
    }
    
    // Simple calculation: count equipment items with manufacturer and model
    const itemsWithDetails = this.equipment.filter(
      item => item.manufacturer && item.model
    ).length;
    
    const confidence = Math.min(1, itemsWithDetails / this.equipment.length);
    
    // Update metadata with calculated confidence
    this.updateMetadata({ confidence });
    
    return confidence;
  }
  
  /**
   * Converts model to a DTO for API response
   */
  toResponseDto() {
    return {
      equipment: this.equipment,
      flags: this.flags,
      metadata: this.metadata,
      building_info: this.buildingInfo
    };
  }
  
  /**
   * Preprocesses notes for AI analysis
   * @returns Preprocessed notes text
   */
  preprocessNotes(): string {
    // Remove excessive whitespace
    let processed = this.notes.replace(/\s+/g, ' ');
    
    // Remove redundant section headers if they appear multiple times
    const headers = ['Equipment:', 'Notes:', 'Observations:'];
    headers.forEach(header => {
      const regex = new RegExp(`(${header}\\s+)(?=.*${header})`, 'gi');
      processed = processed.replace(regex, '');
    });
    
    return processed.trim();
  }
} 