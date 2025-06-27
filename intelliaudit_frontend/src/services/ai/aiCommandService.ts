import { API_BASE_URL } from '../../config';

export interface CommandResponse {
  text: string;
  data?: unknown;
  type: 'text' | 'analysis' | 'error';
}

export interface ConnectionDetails {
  token: string;
  roomName: string;
  serverUrl: string;
  identity: string;
}

/**
 * Send a command to the AI assistant via the NestJS backend
 * @param command The command text to process
 * @param projectId Optional project ID for context
 * @returns The AI assistant's response
 */
export async function sendCommand(command: string, projectId?: string): Promise<CommandResponse> {
  try {
    const url = `${API_BASE_URL}/api/ai-command${projectId ? `?projectId=${projectId}` : ''}`;
    
    console.log('Sending AI command to URL:', url);
    console.log('Command payload:', { text: command });
    console.log('Project ID being sent:', projectId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: command }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Response:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('Error sending command:', error);
    throw new Error(error.message || 'Failed to send command');
  }
}

/**
 * Get connection details for the voice assistant
 * @returns Connection details for LiveKit
 */
export async function getConnectionDetails(): Promise<ConnectionDetails> {
  try {
    const url = `${API_BASE_URL}/api/connection-details`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error: any) {
    console.error('Error getting connection details:', error);
    throw new Error(error.message || 'Failed to get connection details');
  }
} 