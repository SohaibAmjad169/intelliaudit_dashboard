/**
 * API Configuration
 * 
 * This file contains configuration settings for the API clients.
 * Uses the Prisma API endpoints by default.
 */

// Feature flags for API implementations
export const API_CONFIG = {
  // Debug mode - logs additional information about API calls
  debug: false,
};

/**
 * Get the appropriate endpoint prefix based on configuration
 * @param basePath The base endpoint path without any prefixes
 * @returns The properly prefixed endpoint path
 */
export function getEndpoint(basePath: string): string {
  // Remove any leading slashes for consistency
  const cleanPath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
  
  // Check if the path already includes 'api/' prefix to avoid duplication
  if (cleanPath.startsWith('api/')) {
    return cleanPath.substring(4); // Remove 'api/' prefix
  }
  
  // Map endpoints to their proper controller names
  const mapping: Record<string, string> = {
    'projects': 'projects',
    'users': 'users',
    'equipment': 'equipment'
  };
  

  // Get the first segment of the path
  const segments = cleanPath.split('/');
  const rootSegment = segments[0];
  
  // Replace the segment if it's in the mapping
  if (mapping[rootSegment]) {
    segments[0] = mapping[rootSegment];
    return segments.join('/');
  }
  
  return cleanPath;
}


