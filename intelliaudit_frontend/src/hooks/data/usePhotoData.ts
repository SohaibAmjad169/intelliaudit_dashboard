import { useQuery } from '@tanstack/react-query';
import { PhotoCategory } from '@/types/eco';
import { photoService } from '@/services/photos';
// Photo type is imported for future use
// import { Photo } from '@/types/eco';

// Use relative URL path to match the original implementation

// Query keys for React Query
export const photoKeys = {
  all: ['photos'] as const,
  projectPhotos: (projectId: string) => 
    [...photoKeys.all, 'project', projectId] as const,
};

// Helper function to map categories from analysis - currently unused but kept for future implementation
/*
const mapCategoryFromAnalysis = (item: { equipment_type?: string; category?: string; notes?: string }): string => {
  const equipmentType = (item.equipment_type || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const notes = (item.notes || '').toLowerCase();
  
  if (category === 'hvac' || equipmentType.includes('hvac') || 
      equipmentType.includes('heat pump') || equipmentType.includes('furnace') || 
      equipmentType.includes('air conditioner')) {
    return 'hvac';
  } else if (category === 'lighting' || equipmentType.includes('light') || 
            equipmentType.includes('lamp') || equipmentType.includes('fixture')) {
    return 'lighting';
  } else if (category === 'building' || notes.includes('envelope') || 
            notes.includes('insulation') || notes.includes('window') || 
            notes.includes('door')) {
    return 'building';
  } else if (category === 'electrical' || equipmentType.includes('electrical') || 
            equipmentType.includes('panel') || equipmentType.includes('circuit')) {
    return 'electrical';
  } else {
    return 'other';
  }
};
*/

// Fetch photos from the API - now using our standardized photoService
const fetchProjectPhotos = async (projectId: string) => {
  return photoService.fetchProjectPhotos(projectId);
};

/**
 * Hook to fetch project photos with caching
 */
export function useProjectPhotos(projectId: string) {
  return useQuery({
    queryKey: photoKeys.projectPhotos(projectId),
    queryFn: () => fetchProjectPhotos(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
}

// Export the categories as a standalone constant for reuse
export const photoCategories: PhotoCategory[] = [
  { id: 'all', label: 'All Photos' },
  { id: 'building', label: 'Building Envelope' },
  { id: 'hvac', label: 'HVAC Equipment' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'other', label: 'Other' }
];
