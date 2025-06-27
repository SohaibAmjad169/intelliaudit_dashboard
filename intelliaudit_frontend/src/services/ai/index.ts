/**
 * API Services Index
 * 
 * This file exports all API services from a single location,
 * making it easier to import them throughout the application.
 */

// Core API utilities - import from common
export * from '../../services/common/api-client';
export * from '../../services/common/api-config';

// API Services
export * from './services/projects';

// Configuration helper to toggle between API implementations
// Import API_CONFIG if needed for other functionality
// import { API_CONFIG } from '../../services/common/api-config';

