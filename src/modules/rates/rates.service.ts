import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { HistoryInterval, HistoryQueryDto } from './dto/history-query.dto';
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
   * Usa estrategia manual de find + save para compatibilidad con SQLite
   */
  async bulkUpsert(rates: RateData[]): Promise<number> {
    if (rates.length === 0) return 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const rate of rates) {
        // Buscar entidad existente por clave única (exchange_code + currency_pair)
        const existing = await queryRunner.manager.findOneBy(Rate, {
          exchange_code: rate.exchange_code,
          currency_pair: rate.currency_pair,
        });

        if (existing) {
          // Actualizar entidad existente manteniendo su ID
          await queryRunner.manager.update(
            Rate,
            { id: existing.id },
            {
              buy_price: rate.buy_price,
              sell_price: rate.sell_price,
              spread: rate.sell_price ? rate.sell_price - rate.buy_price : undefined,
              volume_24h: rate.volume_24h,
              source: rate.source,
              last_updated: rate.synced_at,
            },
          );
        } else {
          // Insertar nueva entidad
          await queryRunner.manager.insert(Rate, {
            exchange_code: rate.exchange_code,
            currency_pair: rate.currency_pair,
            buy_price: rate.buy_price,
            sell_price: rate.sell_price,
            spread: rate.sell_price ? rate.sell_price - rate.buy_price : undefined,
            volume_24h: rate.volume_24h,
            source: rate.source,
            last_updated: rate.synced_at,
          });
        }
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

  /**
   * Obtener historial de cotizaciones
   */
  async getHistory(query: HistoryQueryDto): Promise<RateHistory[]> {
    const days = query.days || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const qb = this.historyRepo
      .createQueryBuilder('history')
      .where('history.recorded_at >= :startDate', { startDate });

    if (query.exchange_code) {
      qb.andWhere('history.exchange_code = :code', { code: query.exchange_code });
    }
    if (query.currency_pair) {
      qb.andWhere('history.currency_pair = :pair', { pair: query.currency_pair });
    }

    qb.orderBy('history.recorded_at', 'ASC');

    const results = await qb.getMany();

    // Si el intervalo es diario, agrupar por día
    if (query.interval === HistoryInterval.DAILY) {
      return this.groupByDay(results);
    }

    return results;
  }

  /**
   * Agrupar registros por día (toma el último registro del día)
   */
  private groupByDay(records: RateHistory[]): RateHistory[] {
    const grouped = new Map<string, RateHistory>();

    for (const record of records) {
      const dateKey = `${record.exchange_code}-${record.currency_pair}-${record.recorded_at.toISOString().split('T')[0]}`;

      // Guardar el último registro del día (el más reciente)
      const existing = grouped.get(dateKey);
      if (!existing || existing.recorded_at < record.recorded_at) {
        grouped.set(dateKey, record);
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => a.recorded_at.getTime() - b.recorded_at.getTime(),
    );
  }

  /**
   * Obtener historial de un exchange específico
   */
  async getHistoryByExchange(exchangeCode: string, days = 30): Promise<RateHistory[]> {
    return this.getHistory({
      exchange_code: exchangeCode,
      days,
      interval: HistoryInterval.DAILY,
    });
  }

  /**
   * Obtener estadísticas del historial
   */
  async getHistoryStats(
    exchangeCode: string,
    currencyPair: string,
    days = 30,
  ): Promise<{
    min: number;
    max: number;
    avg: number;
    change: number;
    changePercent: number;
    records: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.historyRepo
      .createQueryBuilder('history')
      .select('MIN(history.buy_price)', 'min')
      .addSelect('MAX(history.buy_price)', 'max')
      .addSelect('AVG(history.buy_price)', 'avg')
      .addSelect('COUNT(*)', 'records')
      .where('history.exchange_code = :code', { code: exchangeCode })
      .andWhere('history.currency_pair = :pair', { pair: currencyPair })
      .andWhere('history.recorded_at >= :startDate', { startDate })
      .getRawOne();

    // Obtener primer y último registro para calcular el cambio
    const [firstRecord, lastRecord] = await Promise.all([
      this.historyRepo.findOne({
        where: {
          exchange_code: exchangeCode,
          currency_pair: currencyPair,
          recorded_at: MoreThanOrEqual(startDate),
        },
        order: { recorded_at: 'ASC' },
      }),
      this.historyRepo.findOne({
        where: {
          exchange_code: exchangeCode,
          currency_pair: currencyPair,
          recorded_at: MoreThanOrEqual(startDate),
        },
        order: { recorded_at: 'DESC' },
      }),
    ]);

    const change = firstRecord && lastRecord ? lastRecord.buy_price - firstRecord.buy_price : 0;
    const changePercent =
      firstRecord && firstRecord.buy_price > 0 ? (change / firstRecord.buy_price) * 100 : 0;

    return {
      min: parseFloat(result.min) || 0,
      max: parseFloat(result.max) || 0,
      avg: parseFloat(result.avg) || 0,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePercent * 100) / 100,
      records: parseInt(result.records, 10) || 0,
    };
  }
}
