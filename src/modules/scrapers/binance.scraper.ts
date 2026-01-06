import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IScraper, ScrapedRate } from './interfaces/scraper.interface';

@Injectable()
export class BinanceScraper implements IScraper {
  private readonly logger = new Logger(BinanceScraper.name);
  private readonly BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

  getName(): string {
    return 'BINANCE_P2P';
  }

  async scrape(): Promise<ScrapedRate[]> {
    this.logger.log('🟡 Scraping Binance P2P...');

    try {
      const [buyPrice, sellPrice] = await Promise.all([
        this.fetchP2PPrice('BUY'),
        this.fetchP2PPrice('SELL'),
      ]);

      const rates: ScrapedRate[] = [
        {
          exchange_code: 'BINANCE_P2P',
          currency_pair: 'USDT/VES',
          buy_price: buyPrice,
          sell_price: sellPrice,
          source: 'binance_p2p_api',
        },
      ];

      this.logger.log(`✅ Binance scraped: Buy=${buyPrice}, Sell=${sellPrice}`);
      return rates;
    } catch (error) {
      this.logger.error(`❌ Error scraping Binance: ${error.message}`);
      throw error;
    }
  }

  private async fetchP2PPrice(tradeType: 'BUY' | 'SELL'): Promise<number> {
    const payload = {
      fiat: 'VES',
      page: 1,
      rows: 10,
      tradeType,
      asset: 'USDT',
      publisherType: 'merchant',
      payTypes: ['PagoMovil'],
    };

    const response = await axios.post(this.BINANCE_P2P_URL, payload, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data?.code === '000000' && response.data?.data?.length > 0) {
      const prices = response.data.data.map((ad: any) => parseFloat(ad.adv.price));
      // SIEMPRE tomamos el precio más alto (tanto para BUY como SELL)
      return Math.max(...prices);
    }

    throw new Error(`No P2P ads found for ${tradeType}`);
  }
}
