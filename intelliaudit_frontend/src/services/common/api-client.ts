import { getAuthHeaders } from './auth';
import { ApiErrorResponse } from './types';
import { API_BASE_URL } from '@/config';
import { getEndpoint } from './api-config';

/**
 * Create a standardized API error
 */
const createApiError = (endpoint: string, response?: Response, error?: any): Error => {
  // If we have a response, try to parse the error message
  if (response) {
    return {
      name: 'ApiError',
      message: `API error (${response.status}): ${response.statusText}`,
      status: response.status,
      endpoint,
      ...(error && { originalError: error }),
    } as any;
  }

  // Otherwise, return a general error
  return {
    name: 'ApiError',
    message: `API request failed: ${error?.message || 'Unknown error'}`,
    endpoint,
    ...(error && { originalError: error }),
  } as any;
};

/**
 * API Client for making HTTP requests to the backend
 */

// API version for endpoints

// Interface for API response
// Exported for use in other services
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * API client for making requests to the backend
 */
export const apiClient = {
  /**
   * Make a GET request to the API
   * @param endpoint - The API endpoint to call
   * @param queryParams - Optional query parameters
   * @returns The response data
   */
  async get<T>(endpoint: string, queryParams?: Record<string, string>): Promise<T> {
    try {
      const headers = await getAuthHeaders();

      // Use getEndpoint for consistent path construction
      let url = `${API_BASE_URL}/api/${getEndpoint(endpoint)}`;

      if (queryParams) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value);
          }
        });

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      console.log(`Making GET request to ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorData: ApiErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: 'Unknown error',
            message: response.statusText,
            statusCode: response.status
          };
        }
        console.error(`API Error (${response.status}): ${errorData.message || response.statusText}`);
        throw createApiError(endpoint, response, errorData);
      }

      const responseData = await response.json();
      console.log(`GET ${endpoint} response:`,
        Array.isArray(responseData)
          ? `Array with ${responseData.length} items`
          : typeof responseData
      );

      return responseData;
    } catch (error) {
      console.error(`Error in GET ${endpoint}:`, error);
      if ((error as any).name === 'ApiError') {
        throw error;
      }
      throw createApiError(endpoint, undefined, error);
    }
  },

  /**
   * Make a POST request to the API
   * @param endpoint - The API endpoint to call
   * @param data - The data to send
   * @returns The response data
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const headers = {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json'
      };

      // Ensure we're using the full URL for the API call
      const fullUrl = `${API_BASE_URL}/api/${getEndpoint(endpoint)}`;
      console.log(`Making POST request to ${fullUrl}`, data);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: data !== undefined ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in POST ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a PUT request to the API
   * @param endpoint - The API endpoint to call
   * @param data - The data to send
   * @returns The response data
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/${getEndpoint(endpoint)}`, {
        method: 'PUT',
        headers,
        body: data !== undefined ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in PUT ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a PATCH request to the API
   * @param endpoint - The API endpoint to call
   * @param data - The data to send
   * @returns The response data
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const headers = {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE_URL}/api/${getEndpoint(endpoint)}`, {
        method: 'PATCH',
        headers,
        body: data !== undefined ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in PATCH ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a DELETE request to the API
   * @param endpoint - The API endpoint to call
   * @returns void
   */
  async delete(endpoint: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/${getEndpoint(endpoint)}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in DELETE ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Upload form data to the API
   * @param endpoint - The API endpoint to call
   * @param formData - The form data to send
   * @returns The response data
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[apiClient:${requestId}] Starting postFormData to ${endpoint}`);

    // Log form data contents (without file contents)
    const formDataEntries: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataEntries[key] = `File: ${value.name} (${(value.size / 1024).toFixed(1)}KB, ${value.type})`;
      } else {
        formDataEntries[key] = value;
      }
    }
    console.log(`[apiClient:${requestId}] FormData contents:`, formDataEntries);

    try {
      const headers = await getAuthHeaders();
      // Remove Content-Type to let the browser set it with the boundary
      delete headers['Content-Type'];

      const fullUrl = `${API_BASE_URL}/api/${getEndpoint(endpoint)}`;
      console.log(`[apiClient:${requestId}] Sending POST request to ${fullUrl}`);

      const startTime = Date.now();
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      const duration = Date.now() - startTime;

      console.log(`[apiClient:${requestId}] Response received in ${duration}ms:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      if (!response.ok) {
        console.error(`[apiClient:${requestId}] Request failed with status ${response.status}`);
        let errorText = '';
        try {
          // Try to get error details from response
          const errorData = await response.json();
          console.error(`[apiClient:${requestId}] Error details:`, errorData);
          errorText = JSON.stringify(errorData);
        } catch (e) {
          // If we can't parse JSON, use text
          try {
            errorText = await response.text();
            console.error(`[apiClient:${requestId}] Error response text:`, errorText);
          } catch (textError) {
            console.error(`[apiClient:${requestId}] Could not read error response`);
          }
        }
        throw new Error(`API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      console.log(`[apiClient:${requestId}] Parsing response JSON`);
      const responseData = await response.json();
      console.log(`[apiClient:${requestId}] Response parsed successfully`, {
        dataType: typeof responseData,
        isArray: Array.isArray(responseData),
        keys: typeof responseData === 'object' ? Object.keys(responseData) : 'not an object'
      });

      return responseData;
    } catch (error) {
      console.error(`[apiClient:${requestId}] Error in POST form data to ${endpoint}:`, error);
      console.error(`[apiClient:${requestId}] Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Fetch energy data with specific filtering
   */
  async fetchEnergyData<T>(projectId: string, year?: number, energyType?: string): Promise<T> {
    const queryParams: Record<string, string> = {};
    if (year) queryParams.year = year.toString();
    if (energyType) queryParams.type = energyType;

    return this.get(`projects/${projectId}/energy-data`, queryParams) as Promise<T>;
  },

  /**
   * Post data and get blob response
   */
  async postBlob(endpoint: string, data?: any): Promise<Blob> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/${getEndpoint(endpoint)}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error in POST blob ${endpoint}:`, error);
      throw error;
    }
  }
};