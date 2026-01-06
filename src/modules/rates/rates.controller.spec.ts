import { Test, TestingModule } from '@nestjs/testing';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';

describe('RatesController', () => {
  let controller: RatesController;
  let service: RatesService;

  const mockRatesService = {
    findAll: jest.fn().mockResolvedValue([]),
    findByExchange: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatesController],
      providers: [
        {
          provide: RatesService,
          useValue: mockRatesService,
        },
      ],
    }).compile();

    controller = module.get<RatesController>(RatesController);
    service = module.get<RatesService>(RatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentRates', () => {
    it('should call service.findAll', async () => {
      const query = { exchange_code: 'BCV' };
      await controller.getCurrentRates(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getBcvRate', () => {
    it('should call service.findByExchange with BCV', async () => {
      await controller.getBcvRate();
      expect(service.findByExchange).toHaveBeenCalledWith('BCV');
    });
  });

  describe('getBinanceRate', () => {
    it('should call service.findByExchange with BINANCE_P2P', async () => {
      await controller.getBinanceRate();
      expect(service.findByExchange).toHaveBeenCalledWith('BINANCE_P2P');
    });
  });

  describe('getItalcambiosRate', () => {
    it('should call service.findByExchange with ITALCAMBIOS', async () => {
      await controller.getItalcambiosRate();
      expect(service.findByExchange).toHaveBeenCalledWith('ITALCAMBIOS');
    });
  });
});
