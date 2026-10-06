import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const method = req.method;
    const url = req.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`${method} ${url} ${res.statusCode} +${duration}ms`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const status = (err as { status?: number })?.status || 500;
          this.logger.warn(`${method} ${url} ${status} +${duration}ms - Error`);
        },
      }),
    );
  }
}
