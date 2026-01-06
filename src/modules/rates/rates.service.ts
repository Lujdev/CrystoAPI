import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { RateQueryDto } from './dto/rate-query.dto';
import { Rate } from './entities/rate.entity';
import { RateHistory } from './entities/rate-history.entity';

export interface RateData {
  exchange_code: string;
  currency_pair: string;
  buy_price: number;
  sell_price?: number;
  volume_24h?: number;
  source: string;
  synced_at: Date;
}

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    @InjectRepository(Rate)
    private readonly ratesRepo: Repository<Rate>,
    @InjectRepository(RateHistory)
    private readonly historyRepo: Repository<RateHistory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Bulk upsert de tasas - TODAS en una sola transacción
   */
  async bulkUpsert(rates: RateData[]): Promise<number> {
    if (rates.length === 0) return 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const rate of rates) {
        await queryRunner.manager.upsert(
          Rate,
          {
            exchange_code: rate.exchange_code,
            currency_pair: rate.currency_pair,
            buy_price: rate.buy_price,
            sell_price: rate.sell_price,
            spread: rate.sell_price ? rate.sell_price - rate.buy_price : undefined,
            volume_24h: rate.volume_24h,
            source: rate.source,
            last_updated: rate.synced_at,
          },
          ['exchange_code', 'currency_pair'],
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`💾 Bulk upsert: ${rates.length} rates saved`);
      return rates.length;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Bulk upsert failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Guardar snapshot en historial
   */
  async saveToHistory(rates: RateData[], timestamp: Date): Promise<void> {
    const historyRecords = rates.map((rate) => ({
      exchange_code: rate.exchange_code,
      currency_pair: rate.currency_pair,
      buy_price: rate.buy_price,
      sell_price: rate.sell_price,
      source: rate.source,
      recorded_at: timestamp,
    }));

    await this.historyRepo.insert(historyRecords);
    this.logger.log(`📊 History snapshot: ${historyRecords.length} records`);
  }

  /**
   * Obtener todas las tasas actuales
   */
  async findAll(query?: RateQueryDto): Promise<Rate[]> {
    const qb = this.ratesRepo.createQueryBuilder('rate');

    if (query?.exchange_code) {
      qb.andWhere('rate.exchange_code = :code', { code: query.exchange_code });
    }
    if (query?.currency_pair) {
      qb.andWhere('rate.currency_pair = :pair', { pair: query.currency_pair });
    }

    return qb.orderBy('rate.last_updated', 'DESC').getMany();
  }

  /**
   * Obtener por exchange específico
   */
  async findByExchange(exchangeCode: string): Promise<Rate[]> {
    return this.ratesRepo.find({
      where: { exchange_code: exchangeCode },
      order: { last_updated: 'DESC' },
    });
  }

  /**
   * Calcular variación 24h para todas las tasas
   */
  async calculateVariations(): Promise<void> {
    const rates = await this.ratesRepo.find();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const rate of rates) {
      const historicalRate = await this.historyRepo.findOne({
        where: {
          exchange_code: rate.exchange_code,
          currency_pair: rate.currency_pair,
          recorded_at: LessThan(twentyFourHoursAgo),
        },
        order: { recorded_at: 'DESC' },
      });

      if (historicalRate && historicalRate.buy_price > 0) {
        const variation =
          ((rate.buy_price - historicalRate.buy_price) / historicalRate.buy_price) * 100;
        await this.ratesRepo.update(
          { exchange_code: rate.exchange_code, currency_pair: rate.currency_pair },
          { variation_24h: Math.round(variation * 100) / 100 },
        );
      }
    }
  }

  /**
   * Limpiar historial antiguo
   */
  async cleanupHistory(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await this.historyRepo
      .createQueryBuilder()
      .delete()
      .where('recorded_at < :cutoff', { cutoff: cutoffDate })
      .execute();

    this.logger.log(`🗑️ Cleanup: ${result.affected} old history records deleted`);
    return result.affected || 0;
  }
}
