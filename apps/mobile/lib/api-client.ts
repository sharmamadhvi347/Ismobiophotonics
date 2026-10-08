declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};

import { secureStore } from './secure-store';
import { ApiResponse, ApiErrorResponse } from '@pms/shared-types';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorName: string,
    message: string,
    public readonly rawResponse?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Production API endpoint default (overridable via EXPO_PUBLIC_API_BASE_URL)
const RAW_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://pms-api-gdm2.onrender.com'
).replace(/\/+$/, '');
const API_BASE = `${RAW_BASE_URL}/api`;

type SessionExpiredHandler = () => void;
let onSessionExpiredCallback: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpiredCallback = handler;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = await secureStore.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to PMS server. Please check network connection.',
    );
  }

  // Handle 401 with token refresh rotation
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh')
  ) {
    const refreshToken = await secureStore.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData: ApiResponse<{
              tokens: { accessToken: string; refreshToken: string };
            }> = await refreshRes.json();
            await secureStore.setTokens(refreshData.data.tokens);
            isRefreshing = false;
            onRefreshed(refreshData.data.tokens.accessToken);
            return request<T>(endpoint, options, true);
          } else {
            isRefreshing = false;
            await secureStore.clearTokens();
            onRefreshed(null);
            if (onSessionExpiredCallback) onSessionExpiredCallback();
          }
        } catch {
          isRefreshing = false;
          await secureStore.clearTokens();
          onRefreshed(null);
          if (onSessionExpiredCallback) onSessionExpiredCallback();
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              resolve(request<T>(endpoint, options, true));
            } else {
              reject(new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please log in again.'));
            }
          });
        });
      }
    } else {
      await secureStore.clearTokens();
      if (onSessionExpiredCallback) onSessionExpiredCallback();
    }
  }

  const responseText = await response.text();
  let json: ApiResponse<T> | ApiErrorResponse | null = null;
  if (responseText) {
    try {
      json = JSON.parse(responseText);
    } catch {
      // non-JSON response
    }
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred';
    let errorName = response.statusText || 'Error';

    if (json && 'error' in json && 'message' in json) {
      errorName = (json as ApiErrorResponse).error;
      const msg = (json as ApiErrorResponse).message;
      message = Array.isArray(msg) ? msg.join(', ') : msg;
    }

    throw new ApiError(response.status, errorName, message, json);
  }

  if (json && 'success' in json && json.success === true && 'data' in json) {
    return (json as ApiResponse<T>).data;
  }

  return (json as unknown as T) ?? ({} as T);
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
