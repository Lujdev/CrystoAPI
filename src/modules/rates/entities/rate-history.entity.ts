import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rate_history')
@Index(['exchange_code', 'currency_pair', 'recorded_at'])
export class RateHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  exchange_code: string;

  @Column()
  currency_pair: string;

  @Column('real')
  buy_price: number;

  @Column('real', { nullable: true })
  sell_price: number;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  @Index()
  recorded_at: Date;
}
