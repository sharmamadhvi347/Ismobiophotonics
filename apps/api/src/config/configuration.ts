export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/pms_dev?schema=public',
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || 'default-dev-access-secret-minimum-32-characters',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'default-dev-refresh-secret-minimum-32-characters',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  },
});
