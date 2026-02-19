import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../budgets/entities/budget.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, Transaction])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
