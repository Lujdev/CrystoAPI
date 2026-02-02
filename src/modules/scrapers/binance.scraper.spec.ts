import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { BinanceScraper } from './binance.scraper';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BinanceScraper', () => {
  let scraper: BinanceScraper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BinanceScraper],
    }).compile();

    scraper = module.get<BinanceScraper>(BinanceScraper);
  });

  it('should be defined', () => {
    expect(scraper).toBeDefined();
  });

  it('should scrape Binance rates and pick the MAX price', async () => {
    const mockResponse = {
      data: {
        code: '000000',
        data: [{ adv: { price: '38.5' } }, { adv: { price: '38.7' } }, { adv: { price: '38.6' } }],
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const results = await scraper.scrape();

    expect(results).toHaveLength(1);
    expect(results[0].buy_price).toBe(38.7);
    expect(results[0].sell_price).toBe(38.7);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });
});
