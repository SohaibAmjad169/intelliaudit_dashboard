import { useState } from 'react';
import { apiClient, getEndpoint } from '@/services/common';

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  postal_code?: string; // For backward compatibility
  primaryFunction?: string;
  grossFloorArea?: number;
  yearBuilt?: number;
  projectId?: string;
}

export interface VerifyPortfolioManagerIdOptions {
  portfolioManagerId: string;
}

export interface VerifyPortfolioManagerIdResult {
  success: boolean;
  property?: PropertyData;
  error?: string;
}

/**
 * Hook for interacting with Portfolio Manager properties
 * Provides functionality to verify Portfolio Manager IDs and fetch property data
 */
export function usePortfolioManagerProperty() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  /**
   * Verify a Portfolio Manager ID and fetch property data
   * @param options - Options containing the Portfolio Manager ID to verify
   * @returns Promise with verification result
   */
  const verifyPortfolioManagerId = async (
    options: VerifyPortfolioManagerIdOptions
  ): Promise<VerifyPortfolioManagerIdResult> => {
    const { portfolioManagerId } = options;

    if (!portfolioManagerId) {
      setError('Please enter a Portfolio Manager ID');
      return {
        success: false,
        error: 'Please enter a Portfolio Manager ID'
      };
    }

    setIsLoading(true);
    setError(null);
    setIsVerified(false);
    setProperty(null);

    try {
      // Use the consolidated endpoint selection
      const endpoint = getEndpoint(`portfolio-manager-prisma/properties/${portfolioManagerId}`);
      
      // Fetch property data from Portfolio Manager
      const response = await apiClient.get<any>(endpoint);
      
      // Check if the response was successful
      if (!response || (response.success === false)) {
        const errorMessage = response?.message || 'Property not found';
        throw new Error(errorMessage);
      }
      
      // Handle response with data property (new API format)
      let propertyData: PropertyData;
      
      if (response?.data) {
        propertyData = response.data;
      }
      // Handle legacy response format
      else if (response?.property || response) {
        propertyData = (response?.property || response) as PropertyData;
      } else {
        throw new Error('No property data found in response');
      }
      
      setProperty(propertyData);
      setIsVerified(true);
      setIsLoading(false);
      
      return {
        success: true,
        property: propertyData
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify Portfolio Manager ID';
      setError(errorMessage);
      setIsLoading(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return {
    verifyPortfolioManagerId,
    isLoading,
    error,
    property,
    isVerified,
    clearProperty: () => {
      setProperty(null);
      setIsVerified(false);
      setError(null);
    }
  };
}
