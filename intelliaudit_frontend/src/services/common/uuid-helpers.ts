/**
 * Utilities for working with UUIDs in the application, compatible with Supabase UUID format
 */

/**
 * Normalizes a UUID by ensuring all segments have the correct length.
 * Pads segments with leading zeros if they're too short.
 * 
 * @param uuid - The UUID string to normalize
 * @returns The normalized UUID
 */
export function normalizeUUID(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') return uuid;
  
  // Standard UUID segment lengths
  const segmentLengths = [8, 4, 4, 4, 12];
  
  // Split the UUID into segments
  const segments = uuid.split('-');
  
  // If we don't have exactly 5 segments, return as is
  if (segments.length !== 5) return uuid;
  
  // Pad each segment to its required length
  const normalizedSegments = segments.map((segment, index) => {
    const expectedLength = segmentLengths[index];
    if (segment.length < expectedLength) {
      return segment.padStart(expectedLength, '0');
    }
    return segment;
  });
  
  // Join segments back together
  return normalizedSegments.join('-');
}

/**
 * Validates that a string is a properly formatted UUID
 * Using a less strict regex that allows for shortened first segments
 * which will be normalized when needed
 * 
 * @param uuid - The UUID string to validate
 * @returns boolean indicating if the UUID is valid
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // UUID validation - allows for shortened segments that can be normalized
  const uuidPattern = /^[0-9a-f]{1,8}-[0-9a-f]{1,4}-[0-9a-f]{1,4}-[0-9a-f]{1,4}-[0-9a-f]{1,12}$/i;
  return uuidPattern.test(uuid);
} 