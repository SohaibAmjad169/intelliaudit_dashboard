export const API_URL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:3000';
export const API_PREFIX = `${API_URL}/api`;

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
