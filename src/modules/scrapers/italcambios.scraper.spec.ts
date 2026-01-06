import { Test, TestingModule } from '@nestjs/testing';
import { ItalcambiosScraper } from './italcambios.scraper';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ItalcambiosScraper', () => {
  let scraper: ItalcambiosScraper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItalcambiosScraper],
    }).compile();

    scraper = module.get<ItalcambiosScraper>(ItalcambiosScraper);
  });

  it('should be defined', () => {
    expect(scraper).toBeDefined();
  });

  it('should scrape Italcambios rates correctly', async () => {
    const html = `
      <div class="container-fluid compra">
        <div class="slide-track">
          <p class="small">Compra: 36,50 Venta: 38,20</p>
        </div>
      </div>
    `;
    mockedAxios.get.mockResolvedValueOnce({ data: html });

    const results = await scraper.scrape();

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      exchange_code: 'ITALCAMBIOS',
      currency_pair: 'USD/VES',
      buy_price: 36.5,
      sell_price: 38.2,
      source: 'italcambios_scrape',
    });
  });

  it('should throw error if parsing fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: '<html></html>' });
    await expect(scraper.scrape()).rejects.toThrow('Could not parse Italcambios prices');
  });
});
