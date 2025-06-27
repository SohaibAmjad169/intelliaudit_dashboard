export interface ECOMeasure {
  title: string;
  description: string;
  estimatedSavings: string;
  implementationCost: string;
  paybackPeriod: string;
  priority: 'high' | 'medium' | 'low';
  icon?: React.ReactNode;
  type: 'EEM' | 'WEM' | 'RCM';
  existingCondition: string;
  recommendation: string;
  benefits?: string[];
}

export interface BuildingEnvelope {
  description: string;
  insulation?: string;
  windows?: string;
  doors?: string;
  defects?: string;
}

export interface HVACSystems {
  description: string;
  type?: string;
  age?: string;
  condition?: string;
  maintenanceNeeds?: string;
}

export interface LightingAndElectrical {
  description: string;
  systems?: string;
  controls?: string;
  distribution?: string;
}

export interface OccupancySchedule {
  description: string;
  hours?: string;
  variations?: string;
}

export interface UtilityData {
  description: string;
  bills?: string;
  consumption?: string;
}

export interface EquipmentData {
  description: string;
  nameplateData?: string;
}

export interface ECOMetadata {
  fieldNotesEnhanced?: boolean;
  photosUploaded?: boolean;
  lastUpdated?: string;
}

export interface ECNOAnalysis {
  projectName: string;
  inspectionDate: string;
  facilityLocation: string;
  siteOverview: string;
  facilityType: string;
  facilitySize: string;
  facilityPurpose: string;
  weatherConditions: string;
  buildingEnvelope: BuildingEnvelope;
  hvacSystems: HVACSystems;
  lightingAndElectrical: LightingAndElectrical;
  occupancySchedule: OccupancySchedule;
  utilityData: UtilityData;
  equipmentData: EquipmentData;
  observations: string[];
  recommendations: ECOMeasure[];
  summary: string;
  clientCommunication?: string;
  followUpActions?: string[];
  assumptions?: string[];
  metadata?: ECOMetadata;
  hvacEquipment?: string[] | string;
  lightingEquipment?: string[] | string;
  utilitySummary?: string[] | string;
  equipmentInventory?: string[] | string;
  buildingEnvelopeDescription?: string;
  buildingEnvelopeComponents?: string[] | string;
  occupancyScheduleDetails?: string[] | string;
  savingsPotential?: string[] | string;
  hvacSystemDescription?: string;
  lightingSystemDescription?: string;
  utilityDataDescription?: string;
  equipmentDataDescription?: string;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  createdAt: string;
  equipment_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  location?: string;
  condition?: {
    overall: string;
    visibleIssues: string[];
    estimatedAge?: string;
  };
  specifications?: {
    capacity?: string;
    efficiency?: string | number;
    refrigerantType?: string;
    voltage?: string;
    phase?: string;
  };
  notes?: string;
  confidence?: number;
}

export interface ECOState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: ECNOAnalysis | null;
}

export interface PhotoCategory {
  id: string;
  label: string;
} 