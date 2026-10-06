/**
 * @pms/config - Shared configuration constants across API, Web, and Mobile
 */

export const APP_CONFIG = {
  APP_NAME: 'Project Management System',
  DEFAULT_PORT: 3000,
  API_PREFIX: 'api',
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
} as const;

export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRATION: '15m',
  REFRESH_TOKEN_EXPIRATION: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 64,
  SALT_ROUNDS: 12,
} as const;

export const PROJECT_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
