import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { RatesModule } from './modules/rates/rates.module';
import { ScrapersModule } from './modules/scrapers/scrapers.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // Configuración
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),

    // Logging (Winston)
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            utilities.format.nestLike('CrystoAPI', { prettyPrint: true }),
          ),
        }),
        // Archivo general (3 días)
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '3d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        // Archivo de errores (3 días)
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '3d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        // Archivo de sync (3 días)
        new winston.transports.DailyRotateFile({
          filename: 'logs/sync-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '3d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),

    CommonModule,
    DatabaseModule,
    RatesModule,
    ScrapersModule,
    SchedulerModule,
    HealthModule,
  ],
})
export class AppModule {}
