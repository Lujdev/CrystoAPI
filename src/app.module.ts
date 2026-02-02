import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
        name: 'default',
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000, // segundos a milisegundos
        limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10),
      },
      {
        name: 'history',
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_HISTORY_LIMIT || '10', 10),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
