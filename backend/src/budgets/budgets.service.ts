import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { User } from '../users/entities/user.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const categoryLimits: Record<string, string> = {};
    if (dto.categoryLimits) {
      for (const [k, v] of Object.entries(dto.categoryLimits)) {
        if (v !== null && v !== undefined) {
          categoryLimits[k] = String(Number(v).toFixed(2));
        }
      }
    }
    
    // Ensure month is yyyy-mm-dd for PostgreSQL date type
    const month = dto.month.length === 7 ? `${dto.month}-01` : dto.month;

    const budget = this.budgetRepository.create({
      userId,
      name: dto.name,
      totalAllocation: String(Number(dto.totalAllocation).toFixed(2)),
      categoryLimits,
      month,
    });
    return this.budgetRepository.save(budget);
  }

  async findAllByUser(userId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { userId },
      order: { month: 'DESC', createdAt: 'DESC' },
      relations: ['transactions'],
    });
  }

  async findOne(id: string, user: User): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== user.id) throw new ForbiddenException('Access denied');
    return budget;
  }

  async update(id: string, user: User, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id, user);
    if (dto.name !== undefined) budget.name = dto.name;
    if (dto.totalAllocation !== undefined) {
      budget.totalAllocation = String(Number(dto.totalAllocation).toFixed(2));
    }
    if (dto.categoryLimits !== undefined) {
      const categoryLimits: Record<string, string> = {};
      for (const [k, v] of Object.entries(dto.categoryLimits)) {
        if (v !== null && v !== undefined) {
          categoryLimits[k] = String(Number(v).toFixed(2));
        }
      }
      budget.categoryLimits = categoryLimits;
    }
    if (dto.month !== undefined) {
      budget.month = dto.month.length === 7 ? `${dto.month}-01` : dto.month;
    }
    return this.budgetRepository.save(budget);
  }

  async remove(id: string, user: User): Promise<void> {
    const budget = await this.findOne(id, user);
    await this.budgetRepository.remove(budget);
  }
}
