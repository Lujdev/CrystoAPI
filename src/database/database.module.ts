import { Logger, Module } from '@nestjs/common';
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
        const logger = new Logger('DatabaseModule');
        const dataSource = await new DataSource(options).initialize();

        // Enable WAL mode for better performance
        await dataSource.query('PRAGMA journal_mode = WAL');
        await dataSource.query('PRAGMA synchronous = NORMAL');

        // Run pending migrations
        const pendingMigrations = await dataSource.showMigrations();
        if (pendingMigrations) {
          logger.log('Running pending migrations...');
          await dataSource.runMigrations();
          logger.log('Migrations completed');
        }

        return dataSource;
      },
    }),
  ],
})
export class DatabaseModule {}
