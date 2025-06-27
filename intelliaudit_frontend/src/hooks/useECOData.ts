import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { getAuthHeaders } from '@/services/common/auth';
import { ECOMeasure, Photo } from '@/types/eco';
import { safelyAccessProperty } from '@/utils/response-helpers';
// ECNOAnalysis is imported for type checking but not directly used in this file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// This import is commented out but kept for future implementation
// import { ECNOAnalysis } from '@/types/eco';

interface ECODataState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: any;
}

interface UseECODataProps {
  projectId: string;
  publicView?: boolean;
}

export const useECOData = (projectId: string, publicView: boolean = false) => {
  const [state, setState] = useState<ECODataState>({
    loading: false,
    error: null,
    success: false,
    data: null
  });

  const fetchECOData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let response;
      if (!publicView) {
        // For authenticated views, use auth headers
        const authHeaders = await getAuthHeaders();
        response = await axios.get(
          `${API_BASE_URL}/api/eco/${projectId}`,
          { headers: authHeaders }
        );
      } else {
        // For public views, try to get the project data without auth
        try {
          // First try to fetch from the new public ECO endpoint
          response = await axios.get(
            `${API_BASE_URL}/api/eco/public/${projectId}`
          );
          
          // If we get a response, use it directly
          if (response.data && response.data.analysis) {
            return setState({
              loading: false,
              error: null,
              success: true,
              data: response.data.analysis
            });
          }
        } catch (err) {
          console.log('Could not fetch public ECO data:', err);
          // Handle potential errors or fallback if needed, 
          // but for now we'll let the main catch block handle it.
        }
        
        // If the public endpoint fails or doesn't return data,
        // the code below will try the standard endpoint without auth,
        // which might still fail depending on backend config.
        // Consider adding more robust error handling or logging here.
        if (!response) {
          // Fallback: try the original ECO endpoint without auth 
          // (this might fail if the endpoint is still guarded)
          response = await axios.get(
            `${API_BASE_URL}/api/eco/${projectId}`
          );
        }
      }
      
      const responseData = safelyAccessProperty<any>(response, 'data', null);
      const analysis = safelyAccessProperty<any>(responseData, 'analysis', null);
      
      if (analysis) {
        setState({
          loading: false,
          error: null,
          success: true,
          data: analysis
        });
      } else {
        setState({
          loading: false,
          error: null,
          success: false,
          data: null
        });
      }
    } catch (err) {
      console.error('Error fetching ECO data:', err);
      setState({
        loading: false,
        error: 'Failed to load ECO data. Please try again.',
        success: false,
        data: null
      });
    }
  };

  const regenerateECOData = async () => {
    if (publicView) {
      console.warn('Cannot regenerate ECO data in public view');
      return false;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/api/eco/regenerate/${projectId}`,
        {},
        { headers: authHeaders }
      );
      
      const responseData = safelyAccessProperty<any>(response, 'data', null);
      const analysis = safelyAccessProperty<any>(responseData, 'analysis', null);
      
      if (analysis) {
        setState({
          loading: false,
          error: null,
          success: true,
          data: analysis
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error regenerating ECO data:', err);
      setState({
        loading: false,
        error: 'Failed to regenerate ECO data. Please try again.',
        success: false,
        data: null
      });
      return false;
    }
  };

  const enhanceECOData = async (fieldNotesAnalysis: any, currentRecommendations: ECOMeasure[]) => {
    if (publicView) {
      console.warn('Cannot enhance ECO data in public view');
      return false;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/api/eco-prisma/enhance/${projectId}`,
        {
          fieldNotesAnalysis,
          currentRecommendations
        },
        { headers: authHeaders }
      );

      const responseData = safelyAccessProperty<any>(response, 'data', null);
      const enhancedAnalysis = safelyAccessProperty<any>(responseData, 'enhancedAnalysis', null);
      
      if (enhancedAnalysis) {
        setState({
          loading: false,
          error: null,
          success: true,
          data: enhancedAnalysis
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error enhancing ECO data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to enhance ECO data. Please try again.'
      }));
      return false;
    }
  };

  const generateComprehensiveReport = async (
    fieldNotesAnalysis: any,
    photoAnalysis: { photos: Photo[] },
    currentRecommendations: ECOMeasure[]
  ) => {
    if (publicView) {
      console.warn('Cannot generate comprehensive report in public view');
      return false;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/api/eco/enhance-comprehensive/${projectId}`,
        {
          fieldNotesAnalysis,
          photoAnalysis,
          currentRecommendations
        },
        { headers: authHeaders }
      );

      const responseData = safelyAccessProperty<any>(response, 'data', null);
      const enhancedAnalysis = safelyAccessProperty<any>(responseData, 'enhancedAnalysis', null);
      
      if (enhancedAnalysis) {
        setState({
          loading: false,
          error: null,
          success: true,
          data: enhancedAnalysis
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error generating comprehensive report:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to generate comprehensive report. Please try again.'
      }));
      return false;
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchECOData();
    }
  }, [projectId]);

  return {
    ...state,
    fetchECOData,
    regenerateECOData,
    enhanceECOData,
    generateComprehensiveReport
  };
}; 