import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  constructor(private readonly logger: WinstonLogger) {}

  log(message: string, context?: string, meta?: any) {
    if (meta) {
      this.logger.log(message, { context, ...meta });
    } else {
      this.logger.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    if (meta) {
      this.logger.error(message, { context, trace, ...meta });
    } else if (trace) {
      this.logger.error(message, trace, context);
    } else {
      this.logger.error(message, context);
    }
  }

  warn(message: string, context?: string, meta?: any) {
    if (meta) {
      this.logger.warn(message, { context, ...meta });
    } else {
      this.logger.warn(message, context);
    }
  }

  debug(message: string, context?: string, meta?: any) {
    if (meta) {
      this.logger.debug(message, { context, ...meta });
    } else {
      this.logger.debug(message, context);
    }
  }

  verbose(message: string, context?: string, meta?: any) {
    if (meta) {
      this.logger.verbose(message, { context, ...meta });
    } else {
      this.logger.verbose(message, context);
    }
  }

  /**
   * Log estruturado com traceId para rastreamento
   */
  logWithTrace(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
    message: string,
    traceId: string,
    context?: string,
    meta?: any,
  ) {
    const logData = { ...meta, traceId };
    this[level](message, context, logData);
  }
}

