export interface AshraeEquipmentItem {
  id: number;
  category: string;
  description: string;
  quantity: number;
  wattage_w: number;
  hours_per_week: number;
  annual_hours: number;
  annual_kwh: number;
  formula_used?: string;
  work_shown?: string;
  assumptions?: string;
  recommendations?: string;
} 