import { Test, type TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { BcvScraper } from './bcv.scraper';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BcvScraper', () => {
  let scraper: BcvScraper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcvScraper],
    }).compile();

    scraper = module.get<BcvScraper>(BcvScraper);
  });

  it('should be defined', () => {
    expect(scraper).toBeDefined();
  });

  it('should scrape BCV rates correctly', async () => {
    const html = `
      <div id="dolar"> <strong> 36,501234 </strong> </div>
      <div id="euro"> <strong> 39,204321 </strong> </div>
    `;
    mockedAxios.get.mockResolvedValueOnce({ data: html });

    const results = await scraper.scrape();

    expect(results).toHaveLength(2);
    expect(results).toContainEqual({
      exchange_code: 'BCV',
      currency_pair: 'USD/VES',
      buy_price: 36.501234,
      sell_price: 36.501234,
      source: 'bcv_scrape',
    });
    expect(results).toContainEqual({
      exchange_code: 'BCV',
      currency_pair: 'EUR/VES',
      buy_price: 39.204321,
      sell_price: 39.204321,
      source: 'bcv_scrape',
    });
  });

  it('should handle errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(scraper.scrape()).rejects.toThrow('Network Error');
  });
});
