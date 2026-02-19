import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAllocation: string;

  @Column({ type: 'jsonb', default: {} })
  categoryLimits: Record<string, string>;

  @Column({ type: 'date' })
  month: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Transaction, (t) => t.budget)
  transactions: Transaction[];
}
