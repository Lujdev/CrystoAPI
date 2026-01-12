# Project Context: CrystoAPI NestJS

## Project Overview
**CrystoAPI NestJS** is a backend service providing cryptocurrency and fiat exchange rates for the Venezuelan market. It scrapes data from various sources (Binance, BCV, Italcambios), aggregates it, and serves it via a REST API.

**Architecture:**
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: SQLite (via [TypeORM](https://typeorm.io/))
- **Language**: TypeScript
- **Documentation**: Swagger (OpenAPI) available at `/docs`

## Key Features
1.  **Rate Scraping**:
    - Modular scraper interface (`IScraper`).
    - Implementations for BCV (Central Bank of Venezuela), Binance (P2P USDT/VES), and Italcambios.
    - Scrapers run in parallel via a scheduled Cron job.
2.  **Data Persistence**:
    - `Rate` entity stores the latest current rates.
    - `RateHistory` (implied) stores historical data.
    - `bulkUpsert` logic to update rates efficiently.
3.  **Scheduling**:
    - Main sync job runs every 30 minutes (`*/30 * * * *`) in `RateSyncService`.
    - Daily cleanup job runs at 02:00 AM to prune old history (retention: 30 days).
4.  **API**:
    - Exposes endpoints to query current rates and history.
    - Validated using `class-validator` and `class-transformer`.
    - Rate limiting enabled via `@nestjs/throttler`.
5.  **Logging**:
    - Powered by `winston` and `nest-winston`.
    - Logs rotated daily (`logs/app-%DATE%.log`, `logs/error-...`, `logs/sync-...`).

## Building and Running

### Prerequisites
- Node.js (Version >= 20 recommended based on `@types/node` v25)
- pnpm (Package Manager)
- Docker (Optional, for containerized execution)

### Commands

**Development:**
```bash
# Install dependencies
pnpm install

# Run in development mode (watch)
pnpm run dev

# Run in debug mode
pnpm run dev:debug
```

**Production:**
```bash
# Build the project
pnpm run build

# Run the built artifact
pnpm run start:prod
```

**Testing:**
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e
```

**Database & Migrations:**
```bash
# Run migrations (updates SQLite DB)
pnpm run migration:run

# Generate a new migration (after entity changes)
pnpm run migration:generate --name=MigrationName

# Seed the database
pnpm run seed
```

**Docker:**
```bash
# Build and run with Docker Compose
pnpm run docker:up

# Stop containers
pnpm run docker:down
```

## Development Conventions

- **Style Guide**: The project uses **Biome** for linting and formatting.
    - **Lint**: `pnpm run lint`
    - **Format**: `pnpm run format`
    - **Check**: `pnpm run check` (runs both)
    - **Rules**: 2-space indentation, single quotes, trailing commas, semicolons enabled.
- **Module Structure**: Domain-driven modules located in `src/modules/` (e.g., `rates`, `scrapers`, `health`).
- **Configuration**: Environment variables loaded via `.env` (using `@nestjs/config`). See `.env.example`.
- **Error Handling**: Global validation pipe transforms and validates DTOs.
- **Logging**: Use `AppLoggerService` (wrapper around Winston) for consistent log formatting, especially for sync jobs.

## Directory Overview

- `src/main.ts`: Application entry point. Sets up pipes, swagger, and listening port.
- `src/app.module.ts`: Root module; registers global modules (Config, Database, Schedule, Logger).
- `src/database/`: TypeORM configuration (`data-source.ts`), migrations, and seeds.
- `src/modules/`: Feature modules.
    - `scrapers/`: Logic for fetching external data.
    - `rates/`: Data access layer for rates and history.
- `src/scheduler/`: Orchestrates the scraping and data syncing process.
- `src/common/`: Shared utilities, DTOs, filters, and the custom logger service.
- `data/`: Contains the SQLite database file (`crystoapi.sqlite`).
- `logs/`: Directory for rotated log files.
