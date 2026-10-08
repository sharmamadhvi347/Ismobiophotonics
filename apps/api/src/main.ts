import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createGlobalValidationPipe } from './common/pipes';
import { APP_CONFIG } from '@pms/config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', APP_CONFIG.DEFAULT_PORT);
  const rawCorsOrigin = configService.get<string>('cors.origin', 'http://localhost:5173');
  const corsOrigin = rawCorsOrigin.includes(',')
    ? rawCorsOrigin.split(',').map((o) => o.trim())
    : rawCorsOrigin === '*'
      ? true
      : rawCorsOrigin;

  // CORS configuration
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  // Global routing prefix
  app.setGlobalPrefix(APP_CONFIG.API_PREFIX);

  // Global filters, interceptors, and pipes
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalPipes(createGlobalValidationPipe());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Project Management System API')
    .setDescription(
      'REST API documentation for PMS web and mobile clients (Internship Assessment Technical Submission)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Bearer access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System and database readiness endpoints')
    .addTag('Auth', 'Authentication, Registration, and Token endpoints (Module 01)')
    .addTag('Projects', 'Project management endpoints (Module 02)')
    .addTag('Tasks', 'Task management endpoints (Module 03)')
    .addTag('Dashboard', 'Aggregated workspace metrics (Module 04)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${APP_CONFIG.API_PREFIX}/docs`, app, document, {
    customSiteTitle: 'PMS API Documentation',
  });

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(
    `API Application successfully running on: http://localhost:${port}/${APP_CONFIG.API_PREFIX}`,
  );
  logger.log(
    `Swagger OpenAPI Documentation available at: http://localhost:${port}/${APP_CONFIG.API_PREFIX}/docs`,
  );
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error during application bootstrap:', err);
  process.exit(1);
});
