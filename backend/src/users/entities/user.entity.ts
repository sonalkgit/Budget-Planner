import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Budget } from '../../budgets/entities/budget.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'text', nullable: true })
  displayName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];
}
