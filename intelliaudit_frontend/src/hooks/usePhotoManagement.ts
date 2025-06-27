import { useState } from 'react';
import { Photo, PhotoCategory } from '@/types/eco';
import { useProjectPhotos, photoCategories } from './data/usePhotoData';

/**
 * Hook for managing photos within a project
 * @param projectId - The ID of the project to fetch photos for
 * @returns Object containing photo data, loading state, and management functions
 */
export const usePhotoManagement = (projectId: string) => {
  // Use the React Query based hook for data fetching
  const { 
    data: photos = [], 
    isLoading: loading, 
    error: queryError,
    refetch: fetchPhotos
  } = useProjectPhotos(projectId);

  // State for UI management (not part of the data fetching)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Helper function to get photos by category
  const getPhotosByCategory = (category: string) => {
    if (category === 'all') return photos;
    return photos.filter((photo: any) => photo.category === category);
  };

  // Get filtered photos based on selected category
  const filteredPhotos = getPhotosByCategory(selectedCategory);

  return {
    photos,
    loading,
    error: queryError ? 'Failed to load photos. Please try again.' : null,
    selectedPhoto,
    setSelectedPhoto,
    selectedCategory,
    setSelectedCategory,
    photoCategories,
    filteredPhotos,
    fetchPhotos
  };
}; 