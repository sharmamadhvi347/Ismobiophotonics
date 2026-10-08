import { apiClient } from '../lib/api-client';
import { storage } from '../lib/storage';
import { AuthResponse, LoginDto, RegisterDto, SafeUser } from '@pms/shared-types';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', dto);
    storage.setTokens(data.tokens);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/register', dto);
    storage.setTokens(data.tokens);
    return data;
  },

  async getCurrentUser(): Promise<SafeUser> {
    return apiClient.get<SafeUser>('/auth/me');
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', { refreshToken: refreshToken ?? undefined });
    } catch {
      // ignore server errors during logout
    } finally {
      storage.clearTokens();
    }
  },
};
