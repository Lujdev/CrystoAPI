import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
}
