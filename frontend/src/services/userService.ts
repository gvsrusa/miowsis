import { api } from './api/apiClient';
import { API_CONFIG } from '@/config/api.config';
import type { UserDto } from './api/types';

class UserService {
  async getProfile(): Promise<UserDto> {
    return api.get<UserDto>('/api/users/profile');
  }

  async updateProfile(userData: Partial<UserDto>): Promise<UserDto> {
    return api.put<UserDto>('/api/users/profile', userData);
  }

  async completeOnboarding(): Promise<UserDto> {
    return api.post<UserDto>('/api/users/complete-onboarding');
  }
}

export const userService = new UserService();