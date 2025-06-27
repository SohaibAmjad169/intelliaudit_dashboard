/**
 * Data transformation utilities for API requests and responses
 */

/**
 * Transforms camelCase object keys to snake_case for API compatibility
 */
export function toSnakeCase<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;
    
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? toSnakeCase(item) 
            : item
        );
      } else {
        result[snakeKey] = toSnakeCase(value);
      }
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

/**
 * Transforms snake_case object keys to camelCase for frontend compatibility
 */
export function toCamelCase<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[camelKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? toCamelCase(item) 
            : item
        );
      } else {
        result[camelKey] = toCamelCase(value);
      }
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

/**
 * Removes undefined and null properties from an object
 * Useful for preparing update payloads
 */
export function removeEmptyProperties<T extends Record<string, any>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}
