export interface ScrapedRate {
  exchange_code: string;
  currency_pair: string;
  buy_price: number;
  sell_price?: number;
  volume_24h?: number;
  source: string;
}

export interface IScraper {
  scrape(): Promise<ScrapedRate[]>;
  getName(): string;
}
