import { supabase } from '@/clients';

/**
 * Get authentication headers for API requests
 * @returns Headers with authorization token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No authentication session available');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
} 