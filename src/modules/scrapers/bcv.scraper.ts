import * as https from 'node:https';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper, ScrapedRate } from './interfaces/scraper.interface';

@Injectable()
export class BcvScraper implements IScraper {
  private readonly logger = new Logger(BcvScraper.name);
  private readonly BCV_URL = 'https://www.bcv.org.ve/';

  // Agent HTTPS que ignora errores de certificado SSL
  // Necesario porque el BCV usa un certificado que no está en la cadena de confianza estándar
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  getName(): string {
    return 'BCV';
  }

  async scrape(): Promise<ScrapedRate[]> {
    this.logger.log('🏦 Scraping BCV...');

    try {
      const response = await axios.get(this.BCV_URL, {
        timeout: 15000,
        httpsAgent: this.httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
      });

      const $ = cheerio.load(response.data);
      const rates: ScrapedRate[] = [];

      // Extract USD - BCV publica tasa de referencia única (compra = venta)
      const usdText = $('#dolar').text().trim();
      const usdMatch = usdText.match(/(\d+[.,]\d+)/);
      if (usdMatch) {
        const usdRate = parseFloat(usdMatch[1].replace(',', '.'));
        rates.push({
          exchange_code: 'BCV',
          currency_pair: 'USD/VES',
          buy_price: usdRate,
          sell_price: usdRate,
          source: 'bcv_scrape',
        });
      }

      // Extract EUR - BCV publica tasa de referencia única (compra = venta)
      const eurText = $('#euro').text().trim();
      const eurMatch = eurText.match(/(\d+[.,]\d+)/);
      if (eurMatch) {
        const eurRate = parseFloat(eurMatch[1].replace(',', '.'));
        rates.push({
          exchange_code: 'BCV',
          currency_pair: 'EUR/VES',
          buy_price: eurRate,
          sell_price: eurRate,
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
