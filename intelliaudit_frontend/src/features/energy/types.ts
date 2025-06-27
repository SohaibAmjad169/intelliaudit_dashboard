/**
 * Types for energy efficiency components
 */

export interface Location {
  room?: string;
  area?: string;
  floor?: number;
  building?: string;
}

export interface EquipmentCondition {
  status: string;
  estimatedAge?: number;
  notes?: string;
}

export interface EquipmentSpecifications {
  phase?: string | null;
  voltage?: string | null;
  capacity?: string | null;
  wattage?: number | null;
  refrigerantType?: string | null;
  weeklyHours?: number | null;
  area?: string | null;
  lampsPerFixture?: number | null;
  control?: string | null;
  mountingType?: string | null;
  lampType?: string | null;
  flowRate?: number | string | null;
  flowRateGpm?: number | string | null;
  efficiency?: {
    cooling?: string;
    heating?: string;
  };
}

export interface EquipmentItem {
  id?: string;
  project_id?: string;
  equipment_type?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  make?: string; // For backward compatibility
  category?: string;
  location?: string | { room?: string; area?: string };
  quantity?: number;
  wattage?: number | string;
  capacity?: number | string;
  capacity_unit?: string;
  annual_kwh?: number;
  annual_therms?: number;
  annual_cost?: number;
  annual_hours?: number;
  weekly_hours?: number;
  weeklyHours?: number; // For backward compatibility
  operating_hours?: number;
  hours_per_day?: number;
  days_per_week?: number | string;
  specifications?: EquipmentSpecifications;
  details?: any; // For backward compatibility
  notes?: string;
  photo_url?: string;
  is_per_unit?: boolean;
  lamps_per_fixture?: number;
  number_of_lamps?: number;
  calculation_details?: any;
  formula_used?: string;
  work_shown?: string;
  controlStrategy?: string;
  multiplier?: number;
  end_use_category?: string;
  lamp_type?: string;
  serves?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
  is_edited?: boolean;
  is_new?: boolean;
  is_selected?: boolean;
  is_highlighted?: boolean;
  is_expanded?: boolean;
  is_loading?: boolean;
  is_error?: boolean;
  error_message?: string;
  source?: string;
  source_id?: string;
  source_type?: string;
  source_url?: string;
  source_data?: any;
  source_metadata?: any;
  source_created_at?: string;
  source_updated_at?: string;
  source_deleted_at?: string | null;
  source_is_deleted?: boolean;
  source_is_edited?: boolean;
  source_is_new?: boolean;
  source_is_selected?: boolean;
  source_is_highlighted?: boolean;
  source_is_expanded?: boolean;
  source_is_loading?: boolean;
  source_is_error?: boolean;
  source_error_message?: string;
}

export interface EndUseBreakdown {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ModeledEquipment {
  type: string;
  category: string;
  quantity: number;
  annual_kwh: number;
  description: string;
}

export interface BenchmarkComparison {
  category: string;
  yourBuilding: number;
  benchmark: number;
  difference: number;
}

export interface EnergySavingRecommendation {
  description: string;
  equipment: string;
  savingsKwh: number;
  savingsPercentage: number;
}

export interface EndUseAnalysis {
  breakdown: EndUseBreakdown[];
  modeledBreakdown?: (EndUseBreakdown & { isModeled: boolean })[];
  benchmarkComparison?: BenchmarkComparison[];
  modeledEquipment?: ModeledEquipment[];
  totalAnnualKwh: number;
  totalModeledAnnualKwh?: number;
  buildingType: string;
  squareFootage?: number;
  unitCount?: number;
  assumptions: string[];
  recommendations?: string[] | EnergySavingRecommendation[];
  eui?: number;
  benchmarkEui?: number;
  insights?: string[];
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  wattage: number;
  weekly_hours: number;
  quantity?: number;
  total_apartments?: number;
  annual_kwh: number;
}

export interface ProcessedEquipment {
  category: string;
  items: Equipment[];
  total_kwh: number;
}

export interface EquipmentGroup {
  name: string;
  items: EquipmentItem[];
  totalKwh: number;
}

export interface CategoryData {
  name: string;
  groups: EquipmentGroup[];
  totalKwh: number;
}

export interface EquipmentTableProps {
  equipment: EquipmentItem[];
  columns: any[];  // Using any[] for now since we're using TanStack Table's column type
  totalApartmentCount?: number;
  onRefresh?: () => void;
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  isApartmentEquipment?: (item: EquipmentItem) => boolean;
} 