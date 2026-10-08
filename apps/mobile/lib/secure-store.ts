import * as SecureStore from 'expo-secure-store';

/**
 * Android Keystore-backed secure token storage abstraction via Expo SecureStore.
 * Plaintext AsyncStorage is strictly forbidden for cryptographic credentials.
 */

const ACCESS_TOKEN_KEY = 'pms_mobile_access_token';
const REFRESH_TOKEN_KEY = 'pms_mobile_refresh_token';

export const secureStore = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore storage failure
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore storage failure
    }
  },

  async setTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await Promise.all([
      secureStore.setAccessToken(tokens.accessToken),
      secureStore.setRefreshToken(tokens.refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch {
      // ignore deletion failure
    }
  },
};
