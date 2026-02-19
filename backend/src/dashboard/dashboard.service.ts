import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../budgets/entities/budget.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

export interface CategoryUtilization {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
}

export interface BudgetSummary {
  budget: Budget;
  totalIncome: number;
  totalExpense: number;
  runningBalance: number;
  categoryUtilization: CategoryUtilization[];
  totalAllocation: number;
  remainingBalance: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getBudgetSummary(userId: string, budgetId: string): Promise<BudgetSummary | null> {
    if (!budgetId) return null;
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
      relations: ['transactions'],
    });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException('Access denied');

    const [incomeRow, expenseRow] = await Promise.all([
      this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0)', 'sum')
        .where('t.budgetId = :budgetId', { budgetId })
        .andWhere('t.type = :type', { type: 'income' })
        .getRawOne<{ sum: string }>(),
      this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0)', 'sum')
        .where('t.budgetId = :budgetId', { budgetId })
        .andWhere('t.type = :type', { type: 'expense' })
        .getRawOne<{ sum: string }>(),
    ]);

    const totalIncome = parseFloat(incomeRow?.sum ?? '0');
    const totalExpense = parseFloat(expenseRow?.sum ?? '0');
    const runningBalance = totalIncome - totalExpense;
    const totalAllocation = parseFloat(String(budget.totalAllocation));
    const remainingBalance = totalAllocation - totalExpense;

    const limits = (budget.categoryLimits as Record<string, string>) ?? {};
    const categoryUtilization: CategoryUtilization[] = [];

    for (const [category, limitStr] of Object.entries(limits)) {
      const limit = parseFloat(limitStr);
      const row = await this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0)', 'sum')
        .where('t.budgetId = :budgetId', { budgetId })
        .andWhere('t.category = :category', { category })
        .andWhere('t.type = :type', { type: 'expense' })
        .getRawOne<{ sum: string }>();
      const spent = parseFloat(row?.sum ?? '0');
      const remaining = Math.max(0, limit - spent);
      const utilizationPercent = limit > 0 ? (spent / limit) * 100 : 0;
      categoryUtilization.push({
        category,
        limit,
        spent,
        remaining,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      });
    }

    return {
      budget,
      totalIncome,
      totalExpense,
      runningBalance,
      categoryUtilization,
      totalAllocation,
      remainingBalance,
    };
  }
}
