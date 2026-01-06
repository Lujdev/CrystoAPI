import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RateQueryDto {
  @ApiPropertyOptional({ description: 'Exchange code (e.g., BCV, BINANCE_P2P)' })
  @IsOptional()
  @IsString()
  exchange_code?: string;

  @ApiPropertyOptional({ description: 'Currency pair (e.g., USD/VES, USDT/VES)' })
  @IsOptional()
  @IsString()
  currency_pair?: string;
}
