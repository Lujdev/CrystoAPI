import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { RatesService } from '../modules/rates/rates.service';
import { BcvScraper } from '../modules/scrapers/bcv.scraper';
import { BinanceScraper } from '../modules/scrapers/binance.scraper';
import { ItalcambiosScraper } from '../modules/scrapers/italcambios.scraper';
import { RateSyncService } from './rate-sync.service';

describe('RateSyncService', () => {
  let service: RateSyncService;

  const mockRatesService = {
    bulkUpsert: jest.fn(),
    saveToHistory: jest.fn(),
    calculateVariations: jest.fn(),
    cleanupHistory: jest.fn(),
  };

  const mockScraper = {
    scrape: jest.fn().mockResolvedValue([]),
    getName: jest.fn(),
  };

  const mockLogger = {
    logSync: jest.fn(),
    logScraperError: jest.fn(),
    logSyncError: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateSyncService,
        { provide: RatesService, useValue: mockRatesService },
        { provide: BcvScraper, useValue: mockScraper },
        { provide: BinanceScraper, useValue: mockScraper },
        { provide: ItalcambiosScraper, useValue: mockScraper },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RateSyncService>(RateSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncAllRates', () => {
    it('should coordinate sync of all scrapers', async () => {
      mockScraper.scrape.mockResolvedValueOnce([{ exchange_code: 'BCV', buy_price: 36 }]);

      await service.syncAllRates();

      expect(mockScraper.scrape).toHaveBeenCalledTimes(3);
      expect(mockRatesService.bulkUpsert).toHaveBeenCalled();
      expect(mockRatesService.saveToHistory).toHaveBeenCalled();
      expect(mockRatesService.calculateVariations).toHaveBeenCalled();
    });

    it('should handle concurrency with isRunning flag', async () => {
      // Simulate slow sync
      mockScraper.scrape.mockReturnValue(new Promise((resolve) => setTimeout(resolve, 100)));

      const p1 = service.syncAllRates();
      const p2 = service.syncAllRates();

      await Promise.all([p1, p2]);

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('already in progress'));
    });
  });
});
