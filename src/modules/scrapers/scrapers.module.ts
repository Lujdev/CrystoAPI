import { Module } from '@nestjs/common';
import { BcvScraper } from './bcv.scraper';
import { BinanceScraper } from './binance.scraper';
import { ItalcambiosScraper } from './italcambios.scraper';

@Module({
  providers: [BcvScraper, BinanceScraper, ItalcambiosScraper],
  exports: [BcvScraper, BinanceScraper, ItalcambiosScraper],
})
export class ScrapersModule {}
