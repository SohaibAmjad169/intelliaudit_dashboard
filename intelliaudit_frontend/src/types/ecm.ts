export enum ECMCategory {
  LIGHTING = 'lighting',
  HVAC = 'hvac',
  WATER_HEATING = 'water_heating',
  ENVELOPE = 'envelope',
  RENEWABLE = 'renewable',
  OTHER = 'other'
}

export enum ECMPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

interface Measurement {
  value: number;
  unit: string;
}

interface ECMSavings {
  energy: Measurement;
  cost: Measurement;
  ghg: Measurement;
}

interface ECMFinancials {
  implementationCost: number;
  roi: number;
  paybackPeriod: number;
  npv: number;
  incentives?: number;
}

interface ECMImage {
  url: string;
  caption: string;
}

interface ECMDetails {
  calculation: string;
  assumptions: string[];
  benefits: string[];
}

export interface ECMRecommendation {
  id: string;
  title: string;
  description: string;
  category: ECMCategory;
  priority: ECMPriority;
  savings: ECMSavings;
  financials: ECMFinancials;
  details: ECMDetails;
  images?: ECMImage[];
}
