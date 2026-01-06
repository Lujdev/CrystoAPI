import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper, ScrapedRate } from './interfaces/scraper.interface';

@Injectable()
export class ItalcambiosScraper implements IScraper {
  private readonly logger = new Logger(ItalcambiosScraper.name);
  private readonly URL = 'https://www.italcambio.com';

  getName(): string {
    return 'ITALCAMBIOS';
  }

  async scrape(): Promise<ScrapedRate[]> {
    this.logger.log('🏦 Scraping Italcambios...');

    try {
      const response = await axios.get(this.URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
      });

      const $ = cheerio.load(response.data);

      const container = $('div.container-fluid.compra');
      const slideTrack = container.find('div.slide-track');
      const priceText = slideTrack.find('p.small').text();

      const compraMatch = priceText.match(/Compra:\s*(\d+[.,]\d+)/);
      const ventaMatch = priceText.match(/Venta:\s*(\d+[.,]\d+)/);

      if (!compraMatch || !ventaMatch) {
        throw new Error('Could not parse Italcambios prices');
      }

      const rates: ScrapedRate[] = [
        {
          exchange_code: 'ITALCAMBIOS',
          currency_pair: 'USD/VES',
          buy_price: parseFloat(compraMatch[1].replace(',', '.')),
          sell_price: parseFloat(ventaMatch[1].replace(',', '.')),
          source: 'italcambios_scrape',
        },
      ];

      this.logger.log(`✅ Italcambios scraped: ${rates.length} rates`);
      return rates;
    } catch (error) {
      this.logger.error(`❌ Error scraping Italcambios: ${error.message}`);
      throw error;
    }
  }
}
