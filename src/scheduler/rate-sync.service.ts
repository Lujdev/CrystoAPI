import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { RatesService } from '../modules/rates/rates.service';
import { BcvScraper } from '../modules/scrapers/bcv.scraper';
import { BinanceScraper } from '../modules/scrapers/binance.scraper';
import type { ScrapedRate } from '../modules/scrapers/interfaces/scraper.interface';
import { ItalcambiosScraper } from '../modules/scrapers/italcambios.scraper';

@Injectable()
export class RateSyncService implements OnModuleInit {
  private readonly logger = new Logger(RateSyncService.name);
  private isRunning = false;
  private readonly syncIntervalMinutes: number;

  constructor(
    private readonly ratesService: RatesService,
    private readonly bcvScraper: BcvScraper,
    private readonly binanceScraper: BinanceScraper,
    private readonly italcambiosScraper: ItalcambiosScraper,
    private readonly appLogger: AppLoggerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
  ) {
    this.syncIntervalMinutes = this.configService.get<number>('SYNC_INTERVAL_MINUTES', 30);
  }

  /**
   * Ejecutar scraping inicial y configurar intervalo dinámico
   */
  async onModuleInit() {
    this.logger.log('🚀 Running initial sync on startup...');
    await this.syncAllRates();

    // Configurar intervalo dinámico basado en SYNC_INTERVAL_MINUTES
    const intervalMs = this.syncIntervalMinutes * 60 * 1000;
    const interval = setInterval(() => this.syncAllRates(), intervalMs);
    this.schedulerRegistry.addInterval('rate-sync', interval);
    this.logger.log(`⏰ Sync interval configured: every ${this.syncIntervalMinutes} minutes`);
  }

  /**
   * Sincronización de todas las tasas (llamado por intervalo dinámico)
   */
  async syncAllRates() {
    if (this.isRunning) {
      this.appLogger.warn('⏭️ Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const syncId = Date.now();
    this.appLogger.logSync(syncId, '🚀 Starting sync...');

    try {
      // Ejecutar scrapers en paralelo
      const results = await Promise.allSettled([
        this.bcvScraper.scrape(),
        this.binanceScraper.scrape(),
        this.italcambiosScraper.scrape(),
      ]);

      const ratesToSave: (ScrapedRate & { synced_at: Date })[] = [];
      const timestamp = new Date();

      results.forEach((result, index) => {
        const scraperName = this.getScraperNameByIndex(index);
        if (result.status === 'fulfilled') {
          ratesToSave.push(...result.value.map((r) => ({ ...r, synced_at: timestamp })));
          this.appLogger.logSync(syncId, `✅ ${scraperName} success`);
        } else {
          this.appLogger.logScraperError(scraperName, result.reason, syncId);
        }
      });

      if (ratesToSave.length > 0) {
        await this.ratesService.bulkUpsert(ratesToSave);
        await this.ratesService.saveToHistory(ratesToSave, timestamp);
        await this.ratesService.calculateVariations();
      }

      this.appLogger.logSync(syncId, `✅ Sync completed. Saved ${ratesToSave.length} rates.`);
    } catch (error) {
      this.appLogger.logSyncError(syncId, error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Limpieza diaria a las 2:00 AM
   */
  @Cron('0 2 * * *')
  async cleanupJob() {
    this.logger.log('🗑️ Starting cleanup job...');
    await this.ratesService.cleanupHistory(30);
  }

  private getScraperNameByIndex(index: number): string {
    switch (index) {
      case 0:
        return 'BCV';
      case 1:
        return 'Binance';
      case 2:
        return 'Italcambios';
      default:
        return 'Unknown';
    }
  }
}
