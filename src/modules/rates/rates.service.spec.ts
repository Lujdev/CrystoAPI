import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RatesService } from './rates.service';
import { Rate } from './entities/rate.entity';
import { RateHistory } from './entities/rate-history.entity';

describe('RatesService', () => {
  let service: RatesService;
  let rateRepo: Repository<Rate>;
  let historyRepo: Repository<RateHistory>;
  let dataSource: DataSource;

  const mockRateRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockHistoryRepo = {
    insert: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    })),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOneBy: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        {
          provide: getRepositoryToken(Rate),
          useValue: mockRateRepo,
        },
        {
          provide: getRepositoryToken(RateHistory),
          useValue: mockHistoryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    rateRepo = module.get<Repository<Rate>>(getRepositoryToken(Rate));
    historyRepo = module.get<Repository<RateHistory>>(getRepositoryToken(RateHistory));
    dataSource = module.get<DataSource>(DataSource);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bulkUpsert', () => {
    it('should insert new rate when not existing', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(null);

      const rates = [
        {
          exchange_code: 'BCV',
          currency_pair: 'USD/VES',
          buy_price: 36.5,
          source: 'test',
          synced_at: new Date(),
        },
      ];

      const result = await service.bulkUpsert(rates);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.findOneBy).toHaveBeenCalledWith(Rate, {
        exchange_code: 'BCV',
        currency_pair: 'USD/VES',
      });
      expect(mockQueryRunner.manager.insert).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should update existing rate when found', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue({ id: 1, exchange_code: 'BCV', currency_pair: 'USD/VES' });

      const rates = [
        {
          exchange_code: 'BCV',
          currency_pair: 'USD/VES',
          buy_price: 40.0,
          source: 'test',
          synced_at: new Date(),
        },
      ];

      const result = await service.bulkUpsert(rates);

      expect(mockQueryRunner.manager.findOneBy).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        Rate,
        { id: 1 },
        expect.objectContaining({ buy_price: 40.0 }),
      );
      expect(mockQueryRunner.manager.insert).not.toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.findOneBy.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.bulkUpsert([{
        exchange_code: 'ERR',
        currency_pair: 'X',
        buy_price: 0,
        source: 's',
        synced_at: new Date()
      }])).rejects.toThrow('DB Error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call query builder', async () => {
      await service.findAll({ exchange_code: 'BCV' });
      expect(rateRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('cleanupHistory', () => {
    it('should delete old records', async () => {
      const affected = await service.cleanupHistory(30);
      expect(affected).toBe(1);
      expect(historyRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
