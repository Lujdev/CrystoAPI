import { Module } from '@nestjs/common';
import { RatesModule } from '../modules/rates/rates.module';
import { ScrapersModule } from '../modules/scrapers/scrapers.module';
import { RateSyncService } from './rate-sync.service';

@Module({
  imports: [RatesModule, ScrapersModule],
  providers: [RateSyncService],
})
export class SchedulerModule {}
