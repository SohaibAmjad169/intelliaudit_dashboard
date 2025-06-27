import { apiClient } from '../common/api-client';

/**
 * Company assets service
 * Handles retrieval of company-related assets like logos
 */
export const companyAssetsService = {
  /**
   * Get the company logo URL
   * @returns Promise that resolves to the logo URL
   */
  async getCompanyLogo(): Promise<string> {
    const response = await apiClient.get<{ url: string }>('company-assets/logo');
    return response.url;
  }
};

// For backward compatibility
export const getCompanyLogo = companyAssetsService.getCompanyLogo;
