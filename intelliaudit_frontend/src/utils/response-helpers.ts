/**
 * Utility functions for safely handling API responses
 */

/**
 * Safely access data from API responses
 * @param data Unknown data from API response
 * @param fallback Default value to return if data is invalid
 * @returns The data cast to type T or the fallback value
 */
export function safelyAccessResponseData<T>(data: unknown, fallback: T): T {
  if (data === null || data === undefined) {
    return fallback;
  }
  return data as T;
}

/**
 * Safely access a property from an object of unknown type
 * @param obj Object of unknown type
 * @param key Property key to access
 * @param fallback Default value to return if property doesn't exist
 * @returns The property value cast to type T or the fallback value
 */
export function safelyAccessProperty<T>(obj: unknown, key: string, fallback: T): T {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return fallback;
  }
  
  try {
    const value = (obj as Record<string, unknown>)[key];
    return value !== undefined ? value as T : fallback;
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely access an array from an unknown object
 * @param data Unknown data that might be an array
 * @returns The data as an array of type T or an empty array
 */
export function safelyAccessArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return [];
}

/**
 * Custom type for API responses to help with TypeScript
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, any>;
  config: Record<string, any>;
} 