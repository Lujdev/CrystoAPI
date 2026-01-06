# AGENTS.md - CrystoAPI NestJS

## Project Overview

CrystoAPI NestJS is a backend service providing cryptocurrency and fiat exchange rates for the Venezuelan market. It scrapes data from multiple sources (BCV, Binance P2P, Italcambios), aggregates it, and serves it via a REST API.

- **Framework**: NestJS 11
- **Database**: SQLite via TypeORM
- **Language**: TypeScript (ES2023 target)
- **Package Manager**: pnpm

## Build/Lint/Test Commands

### Development
```bash
pnpm install           # Install dependencies
pnpm run dev           # Start dev server with watch mode
pnpm run dev:debug     # Start with debugger attached
pnpm run build         # Build for production
pnpm run start:prod    # Run production build
```

### Linting and Formatting (Biome)
```bash
pnpm run lint          # Run linter on src/ and test/
pnpm run format        # Format code with Biome
pnpm run check         # Run both lint and format checks
pnpm run fix           # Auto-fix lint and format issues
pnpm run typecheck     # TypeScript type checking (tsc --noEmit)
```

### Testing
```bash
pnpm run test                          # Run all unit tests
pnpm run test -- path/to/file.spec.ts  # Run a single test file
pnpm run test -- --testNamePattern="should scrape"  # Run tests matching pattern
pnpm run test:watch                    # Run tests in watch mode
pnpm run test:cov                      # Run tests with coverage
pnpm run test:e2e                      # Run end-to-end tests
```

### Database
```bash
pnpm run migration:run       # Run pending migrations
pnpm run migration:generate  # Generate migration after entity changes
pnpm run migration:revert    # Revert last migration
pnpm run seed                # Seed the database
```

### Docker
```bash
pnpm run docker:up           # Build and start containers
pnpm run docker:down         # Stop containers
pnpm run docker:logs         # View container logs
```

## Code Style Guidelines

### Biome Configuration
The project uses **Biome** (not ESLint/Prettier) for linting and formatting.

- **Indent**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Single quotes (`'`)
- **Semicolons**: Always required
- **Trailing commas**: Always (`all`)

### Import Organization
Imports should be organized (Biome auto-organizes). Follow this order:
1. External packages (`@nestjs/*`, third-party)
2. Internal modules (relative paths)
3. Types (using `type` keyword for type-only imports)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { RatesService } from './rates.service';
import type { LoggerService } from '@nestjs/common';
```

### TypeScript Conventions

#### Types and Interfaces
- Use `interface` for object shapes and contracts
- Use `type` for unions, intersections, and type aliases
- Prefix interfaces with `I` for scraper contracts: `IScraper`
- Use `type` imports when importing only types: `import type { Logger } from 'winston'`

```typescript
export interface IScraper {
  scrape(): Promise<ScrapedRate[]>;
  getName(): string;
}

export interface ScrapedRate {
  exchange_code: string;
  currency_pair: string;
  buy_price: number;
  sell_price?: number;
}
```

#### Naming Conventions
- **Classes**: PascalCase (`RatesService`, `BcvScraper`)
- **Files**: kebab-case (`rates.service.ts`, `bcv.scraper.ts`)
- **Variables/Functions**: camelCase (`syncAllRates`, `isRunning`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE for true constants
- **Database columns**: snake_case (`exchange_code`, `buy_price`)
- **DTOs**: PascalCase with `Dto` suffix (`RateQueryDto`)
- **Entities**: PascalCase matching table name (`Rate`, `RateHistory`)

### NestJS Patterns

#### Module Structure
Files are organized by feature in `src/modules/<feature>/`:
```
src/modules/rates/
  dto/rate-query.dto.ts
  entities/rate.entity.ts
  rates.controller.ts
  rates.service.ts
  rates.module.ts
  rates.service.spec.ts
```

#### Dependency Injection
Use constructor injection with decorators:
```typescript
@Injectable()
export class RatesService {
  constructor(
    @InjectRepository(Rate)
    private readonly ratesRepo: Repository<Rate>,
    private readonly dataSource: DataSource,
  ) {}
}
```

#### Decorators
- Use `@Injectable()` for all services
- Use `@Controller('path')` for controllers
- Use `@ApiTags()`, `@ApiOperation()` for Swagger docs
- Use `@Cron()` for scheduled tasks

### Error Handling
- Use NestJS built-in exceptions (`BadRequestException`, etc.)
- Log errors with context using the Logger class
- Re-throw errors after logging for proper error propagation

```typescript
try {
  // operation
} catch (error) {
  this.logger.error(`Operation failed: ${error.message}`);
  throw error;
}
```

### Logging
Use NestJS `Logger` with class context:
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log('Message');
this.logger.error('Error message');
```

### Validation (DTOs)
Use `class-validator` decorators:
```typescript
export class RateQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exchange_code?: string;
}
```

### Testing Conventions
- Test files: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)
- Use `@nestjs/testing` Test utilities
- Mock external dependencies (axios, repositories)
- Structure: `describe` > `beforeEach` > `it`

```typescript
describe('BcvScraper', () => {
  let scraper: BcvScraper;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BcvScraper],
    }).compile();
    scraper = module.get<BcvScraper>(BcvScraper);
  });

  it('should be defined', () => {
    expect(scraper).toBeDefined();
  });
});
```

## Directory Structure
```
src/
  main.ts                    # Entry point
  app.module.ts              # Root module
  common/                    # Shared utilities, DTOs, logger
  database/                  # TypeORM config, migrations, seeds
  modules/                   # Feature modules
    rates/                   # Rate data access and API
    scrapers/                # External data fetching
    health/                  # Health check endpoints
  scheduler/                 # Cron jobs for data sync
test/                        # E2E tests
data/                        # SQLite database file
logs/                        # Rotated log files
```

## Key Patterns
- Scrapers implement `IScraper` interface
- Scheduled sync runs every 30 minutes via `@Cron('*/30 * * * *')`
- Database uses `bulkUpsert` for efficient rate updates
- API endpoints versioned under `/api/v1/`
- Swagger docs available at `/docs`
