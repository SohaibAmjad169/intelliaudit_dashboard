import { apiClient } from '../common/api-client';

export interface ProfileResponse {
  id: string;
  email: string;
  avatar_url: string | null;
  updated_at: string;
}

export const UserService = {
  /**
   * Update the user's avatar
   * @param file The avatar file to upload
   * @returns The updated profile data
   */
  async updateAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    return await apiClient.postFormData<ProfileResponse>('users/profile/', formData);
  },

  /**
   * Get the current user's profile
   * @returns The user profile data
   */
  async getProfile(): Promise<ProfileResponse> {
    return await apiClient.get<ProfileResponse>('users/profile/');
  }
}; 