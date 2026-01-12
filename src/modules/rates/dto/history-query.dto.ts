import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum HistoryInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ description: 'Exchange code (e.g., BCV, BINANCE_P2P)' })
  @IsOptional()
  @IsString()
  exchange_code?: string;

  @ApiPropertyOptional({ description: 'Currency pair (e.g., USD/VES, USDT/VES)' })
  @IsOptional()
  @IsString()
  currency_pair?: string;

  @ApiPropertyOptional({
    description: 'Number of days to retrieve (1-30)',
    minimum: 1,
    maximum: 30,
    default: 7,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number = 7;

  @ApiPropertyOptional({
    description: 'Data interval grouping',
    enum: HistoryInterval,
    default: HistoryInterval.DAILY,
  })
  @IsOptional()
  @IsEnum(HistoryInterval)
  interval?: HistoryInterval = HistoryInterval.DAILY;
}
