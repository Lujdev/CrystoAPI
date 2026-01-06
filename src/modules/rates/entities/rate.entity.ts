import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('rates')
@Index(['exchange_code', 'currency_pair'], { unique: true })
export class Rate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  exchange_code: string;

  @Column()
  @Index()
  currency_pair: string;

  @Column('real')
  buy_price: number;

  @Column('real', { nullable: true })
  sell_price: number;

  @Column('real', { nullable: true })
  spread: number;

  @Column('real', { default: 0 })
  variation_24h: number;

  @Column('real', { nullable: true })
  volume_24h: number;

  @Column({ default: 'api' })
  source: string;

  @UpdateDateColumn()
  last_updated: Date;

  // Getter calculated (not stored)
  get avg_price(): number {
    if (this.sell_price) {
      return (this.buy_price + this.sell_price) / 2;
    }
    return this.buy_price;
  }
}
