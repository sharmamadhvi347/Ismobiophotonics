import { apiClient } from '../lib/api-client';
import { secureStore } from '../lib/secure-store';
import { AuthResponse, LoginDto, RegisterDto, SafeUser } from '@pms/shared-types';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', dto);
    await secureStore.setTokens(data.tokens);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/register', dto);
    await secureStore.setTokens(data.tokens);
    return data;
  },

  async getCurrentUser(): Promise<SafeUser> {
    return apiClient.get<SafeUser>('/auth/me');
  },

  async logout(): Promise<void> {
    const refreshToken = await secureStore.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', {
        refreshToken: refreshToken ?? undefined,
      });
    } catch {
      // ignore network errors on logout
    } finally {
      await secureStore.clearTokens();
    }
  },
};
