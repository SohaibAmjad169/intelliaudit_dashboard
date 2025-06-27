// API configuration
export const API_BASE_URL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:3000';

// Application settings
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.pdf', '.jpg', '.png', '.doc', '.docx'],
  DATE_FORMAT: 'YYYY-MM-DD',
  CURRENCY: 'USD',
};

// Theme configuration
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#0066cc',
  SECONDARY_COLOR: '#4a90e2',
  SUCCESS_COLOR: '#28a745',
  ERROR_COLOR: '#dc3545',
  WARNING_COLOR: '#ffc107',
};

// Cache configuration
export const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_ITEMS: 100,
};
