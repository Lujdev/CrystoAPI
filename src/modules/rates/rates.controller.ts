import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HistoryQueryDto } from './dto/history-query.dto';
import { RateQueryDto } from './dto/rate-query.dto';
import { RatesService } from './rates.service';

@ApiTags('Rates')
@Controller('api/v1/rates')
export class RatesController {
  private readonly logger = new Logger(RatesController.name);

  constructor(private readonly ratesService: RatesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener cotizaciones actuales' })
  @ApiQuery({ name: 'exchange_code', required: false })
  @ApiQuery({ name: 'currency_pair', required: false })
  async getCurrentRates(@Query() query: RateQueryDto) {
    this.logger.log(`📊 GET /rates - ${JSON.stringify(query)}`);
    return this.ratesService.findAll(query);
  }

  @Get('bcv')
  @ApiOperation({ summary: 'Obtener cotización BCV' })
  async getBcvRate() {
    return this.ratesService.findByExchange('BCV');
  }

  @Get('binance')
  @ApiOperation({ summary: 'Obtener cotización Binance P2P' })
  async getBinanceRate() {
    return this.ratesService.findByExchange('BINANCE_P2P');
  }

  @Get('italcambios')
  @ApiOperation({ summary: 'Obtener cotización Italcambios' })
  async getItalcambiosRate() {
    return this.ratesService.findByExchange('ITALCAMBIOS');
  }

  @Get('history')
  @Throttle({ history: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Obtener historial de cotizaciones (hasta 30 días)' })
  @ApiQuery({ name: 'exchange_code', required: false, description: 'Código del exchange' })
  @ApiQuery({ name: 'currency_pair', required: false, description: 'Par de divisas' })
  @ApiQuery({ name: 'days', required: false, description: 'Días de historial (1-30)', example: 7 })
  @ApiQuery({
    name: 'interval',
    required: false,
    enum: ['hourly', 'daily'],
    description: 'Intervalo de agrupación',
  })
  async getHistory(@Query() query: HistoryQueryDto) {
    this.logger.log(`📈 GET /rates/history - ${JSON.stringify(query)}`);
    return this.ratesService.getHistory(query);
  }

  @Get('history/:exchange_code')
  @Throttle({ history: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Obtener historial de un exchange específico' })
  @ApiParam({ name: 'exchange_code', description: 'Código del exchange (BCV, BINANCE_P2P, etc.)' })
  @ApiQuery({ name: 'days', required: false, description: 'Días de historial (1-30)', example: 30 })
  async getHistoryByExchange(
    @Param('exchange_code') exchangeCode: string,
    @Query('days') days?: number,
  ) {
    this.logger.log(`📈 GET /rates/history/${exchangeCode} - days: ${days || 30}`);
    return this.ratesService.getHistoryByExchange(exchangeCode.toUpperCase(), days || 30);
  }

  @Get('history/:exchange_code/:currency_pair/stats')
  @Throttle({ history: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Obtener estadísticas del historial' })
  @ApiParam({ name: 'exchange_code', description: 'Código del exchange' })
  @ApiParam({ name: 'currency_pair', description: 'Par de divisas (usar guión, ej: USD-VES)' })
  @ApiQuery({ name: 'days', required: false, description: 'Días de historial (1-30)', example: 30 })
  async getHistoryStats(
    @Param('exchange_code') exchangeCode: string,
    @Param('currency_pair') currencyPair: string,
    @Query('days') days?: number,
  ) {
    // Convertir USD-VES a USD/VES
    const pair = currencyPair.replace('-', '/').toUpperCase();
    this.logger.log(`📊 GET /rates/history/${exchangeCode}/${pair}/stats - days: ${days || 30}`);
    return this.ratesService.getHistoryStats(exchangeCode.toUpperCase(), pair, days || 30);
  }
}
