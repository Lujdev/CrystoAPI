import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper, ScrapedRate } from './interfaces/scraper.interface';

@Injectable()
export class BcvScraper implements IScraper {
  private readonly logger = new Logger(BcvScraper.name);
  private readonly BCV_URL = 'https://www.bcv.org.ve/';

  getName(): string {
    return 'BCV';
  }

  async scrape(): Promise<ScrapedRate[]> {
    this.logger.log('🏦 Scraping BCV...');

    try {
      const response = await axios.get(this.BCV_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
      });

      const $ = cheerio.load(response.data);
      const rates: ScrapedRate[] = [];

      // Extract USD
      const usdText = $('#dolar').text().trim();
      const usdMatch = usdText.match(/(\d+[.,]\d+)/);
      if (usdMatch) {
        rates.push({
          exchange_code: 'BCV',
          currency_pair: 'USD/VES',
          buy_price: parseFloat(usdMatch[1].replace(',', '.')),
          source: 'bcv_scrape',
        });
      }

      // Extract EUR
      const eurText = $('#euro').text().trim();
      const eurMatch = eurText.match(/(\d+[.,]\d+)/);
      if (eurMatch) {
        rates.push({
          exchange_code: 'BCV',
          currency_pair: 'EUR/VES',
          buy_price: parseFloat(eurMatch[1].replace(',', '.')),
          source: 'bcv_scrape',
        });
      }

      this.logger.log(`✅ BCV scraped: ${rates.length} rates`);
      return rates;
    } catch (error) {
      this.logger.error(`❌ Error scraping BCV: ${error.message}`);
      throw error;
    }
  }
}
