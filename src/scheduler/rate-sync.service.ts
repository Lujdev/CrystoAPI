import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { RatesService } from '../modules/rates/rates.service';
import { BcvScraper } from '../modules/scrapers/bcv.scraper';
import { BinanceScraper } from '../modules/scrapers/binance.scraper';
import { ItalcambiosScraper } from '../modules/scrapers/italcambios.scraper';

@Injectable()
export class RateSyncService {
  private readonly logger = new Logger(RateSyncService.name);
  private isRunning = false;

  constructor(
    private readonly ratesService: RatesService,
    private readonly bcvScraper: BcvScraper,
    private readonly binanceScraper: BinanceScraper,
    private readonly italcambiosScraper: ItalcambiosScraper,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * ÚNICO CRON JOB para sincronización de todas las tasas
   */
  @Cron('*/30 * * * *')
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

      const ratesToSave: any[] = [];
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
