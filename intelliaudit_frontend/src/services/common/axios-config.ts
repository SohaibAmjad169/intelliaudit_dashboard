import axios from 'axios';
import { getAuthHeaders } from './auth';
import { API_BASE_URL } from '@/config';

// Create axios instance with common configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 1 minute timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth headers
axiosInstance.interceptors.request.use(
  async (config: any) => {
    // Don't modify the original config
    const newConfig = { ...config };
    
    // Only add auth headers for API requests
    if (newConfig.url && !newConfig.url.includes('/auth/')) {
      try {
        const authHeaders = await getAuthHeaders();
        newConfig.headers = {
          ...newConfig.headers,
          ...authHeaders
        };
      } catch (error) {
        console.error('Error attaching auth headers:', error);
      }
    }
    
    return newConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance; 