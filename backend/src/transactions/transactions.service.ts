import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BudgetsService } from '../budgets/budgets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly budgetsService: BudgetsService,
  ) {}

  async create(user: User, dto: CreateTransactionDto): Promise<Transaction> {
    const budget = await this.budgetsService.findOne(dto.budgetId, user);
    const amountStr = Number(dto.amount).toFixed(2);

    if (dto.type === 'expense') {
      await this.assertCategoryNotOverspent(budget, dto.category, parseFloat(amountStr), null);
    }

    const transaction = this.transactionRepository.create({
      budgetId: budget.id,
      type: dto.type,
      amount: amountStr,
      category: dto.category,
      note: dto.note ?? null,
    });
    return this.transactionRepository.save(transaction);
  }

  async findAllByBudget(budgetId: string, user: User): Promise<Transaction[]> {
    await this.budgetsService.findOne(budgetId, user);
    return this.transactionRepository.find({
      where: { budgetId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['budget'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.budget.userId !== user.id) throw new ForbiddenException('Access denied');
    return transaction;
  }

  async update(id: string, user: User, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id, user);
    const budget = await this.budgetsService.findOne(transaction.budgetId, user);

    const newType = dto.type ?? transaction.type;
    const newAmount = dto.amount !== undefined ? Number(dto.amount).toFixed(2) : transaction.amount;
    const newCategory = dto.category ?? transaction.category;

    if (newType === 'expense') {
      await this.assertCategoryNotOverspent(
        budget,
        newCategory,
        parseFloat(newAmount),
        transaction.id,
      );
    }

    if (dto.type !== undefined) transaction.type = dto.type;
    if (dto.amount !== undefined) transaction.amount = newAmount;
    if (dto.category !== undefined) transaction.category = dto.category;
    if (dto.note !== undefined) transaction.note = dto.note;

    return this.transactionRepository.save(transaction);
  }

  async remove(id: string, user: User): Promise<void> {
    const transaction = await this.findOne(id, user);
    await this.transactionRepository.remove(transaction);
  }

  private async assertCategoryNotOverspent(
    budget: Budget,
    category: string,
    amount: number,
    excludeTransactionId: string | null,
  ): Promise<void> {
    const limitStr = (budget.categoryLimits as Record<string, string>)?.[category];
    if (!limitStr) return;

    const limit = parseFloat(limitStr);
    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0)', 'sum')
      .where('t.budgetId = :budgetId', { budgetId: budget.id })
      .andWhere('t.category = :category', { category })
      .andWhere('t.type = :type', { type: 'expense' });
    if (excludeTransactionId) {
      qb.andWhere('t.id != :id', { id: excludeTransactionId });
    }
    const row = await qb.getRawOne<{ sum: string }>();
    const current = parseFloat(row?.sum ?? '0');
    if (current + amount > limit) {
      throw new BadRequestException(
        `Category "${category}" would exceed limit of ${limit}. Current: ${current.toFixed(2)}, requested: ${amount.toFixed(2)}`,
      );
    }
  }
}
