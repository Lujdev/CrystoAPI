import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...AppDataSource.options,
        autoLoadEntities: true,
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        const dataSource = await new DataSource(options).initialize();
        // Enable WAL mode
        await dataSource.query('PRAGMA journal_mode = WAL');
        await dataSource.query('PRAGMA synchronous = NORMAL');
        return dataSource;
      },
    }),
  ],
})
export class DatabaseModule {}
