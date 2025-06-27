/**
 * Main types index file - exports all types from the application
 */

// Export all model types that align with Prisma schema
export * from './models';

// Export all DTOs for API communication
export * from './dto';

/**
 * Legacy types - these will be phased out in favor of the Prisma-aligned models
 */
export interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  status: 'incomplete' | 'complete';
  equipment: Equipment[];
  createdAt: Date;
  updatedAt: Date;
}

// This is a legacy interface, use the BaseEquipment or EquipmentAnalysis from './models' instead
export interface Equipment {
  id: string;
  type: string;
  description: string;
  quantity: number;
  efficiency?: string;
}

// This is a legacy interface, use EnergyConservationMeasure from './models' instead
export interface ECM {
  id: string;
  title: string;
  description: string;
  energySavings: number;
  costSavings: number;
  paybackPeriod: number;
  priority: 'high' | 'medium' | 'low';
}