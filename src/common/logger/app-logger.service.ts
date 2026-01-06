import { Inject, Injectable, type LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: Logger,
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.winstonLogger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.winstonLogger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string) {
    this.winstonLogger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.winstonLogger.debug(message, { context: context || this.context });
  }

  /**
   * Log de error de scraper
   */
  logScraperError(scraperName: string, error: Error, syncId?: number) {
    this.winstonLogger.error(`❌ [${scraperName}] ${error.message}`, {
      context: 'ScraperError',
      scraper: scraperName,
      syncId,
      stack: error.stack,
    });
  }

  /**
   * Log de sync
   */
  logSync(syncId: number, message: string, data?: Record<string, any>) {
    this.winstonLogger.info(message, {
      context: 'RateSync',
      syncId,
      ...data,
    });
  }

  /**
   * Log de error crítico de sync
   */
  logSyncError(syncId: number, error: Error, context?: Record<string, any>) {
    this.winstonLogger.error(`❌ [SYNC-${syncId}] ${error.message}`, {
      context: 'RateSyncError',
      syncId,
      stack: error.stack,
      ...context,
    });
  }
}
