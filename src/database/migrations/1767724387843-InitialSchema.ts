import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1767724387843 implements MigrationInterface {
  name = 'InitialSchema1767724387843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rates" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "exchange_code" varchar NOT NULL, "currency_pair" varchar NOT NULL, "buy_price" real NOT NULL, "sell_price" real, "spread" real, "variation_24h" real NOT NULL DEFAULT (0), "volume_24h" real, "source" varchar NOT NULL DEFAULT ('api'), "last_updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_796d437cf783697aafb1c4d55d" ON "rates" ("exchange_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f332a2b389ecee33b2332eefb7" ON "rates" ("currency_pair") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_517137239dcbbf1ea3f3399c54" ON "rates" ("exchange_code", "currency_pair") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "exchange_code" varchar NOT NULL, "currency_pair" varchar NOT NULL, "buy_price" real NOT NULL, "sell_price" real, "source" varchar, "recorded_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7bd20588b848831a064146cb22" ON "rate_history" ("recorded_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5df66f846cf458ee66868f6df8" ON "rate_history" ("exchange_code", "currency_pair", "recorded_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exchanges" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "code" varchar NOT NULL, "name" varchar NOT NULL, "type" text NOT NULL, "description" varchar, "website" varchar, "is_active" boolean NOT NULL DEFAULT (1), "update_interval_seconds" integer NOT NULL DEFAULT (3600), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_229b31a06e59b90be576b30414e" UNIQUE ("code"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exchanges"`);
    await queryRunner.query(`DROP INDEX "IDX_5df66f846cf458ee66868f6df8"`);
    await queryRunner.query(`DROP INDEX "IDX_7bd20588b848831a064146cb22"`);
    await queryRunner.query(`DROP TABLE "rate_history"`);
    await queryRunner.query(`DROP INDEX "IDX_517137239dcbbf1ea3f3399c54"`);
    await queryRunner.query(`DROP INDEX "IDX_f332a2b389ecee33b2332eefb7"`);
    await queryRunner.query(`DROP INDEX "IDX_796d437cf783697aafb1c4d55d"`);
    await queryRunner.query(`DROP TABLE "rates"`);
  }
}
