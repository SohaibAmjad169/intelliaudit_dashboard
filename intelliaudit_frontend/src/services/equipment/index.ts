export * from './analysis';
// export * from './field-notes'; // Deprecated - use import from '@/services/field-notes' instead
export * from './equipment-v2';
// export * from './ashrae-equipment'; // Deprecated - use import from '@/services/field-notes' instead
export * from './photo-metadata';

// Re-export the v2 service as the main equipment service
export { equipmentV2Service as equipmentService } from './equipment-v2';