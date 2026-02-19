import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Budget } from '../budgets/entities/budget.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let budgetRepo: any;
  let transactionRepo: any;

  const mockBudget = {
    id: 'b1',
    userId: 'user-1',
    name: 'Jan',
    totalAllocation: '10000',
    categoryLimits: { Food: '3000' },
    month: '2025-01',
    transactions: []
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum: '1000' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Budget),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
    budgetRepo = module.get(getRepositoryToken(Budget));
    transactionRepo = module.get(getRepositoryToken(Transaction));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getBudgetSummary', () => {
    it('throws NotFound when budget missing', async () => {
      budgetRepo.findOne.mockResolvedValue(null);
      await expect(service.getBudgetSummary('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when user does not own budget', async () => {
      budgetRepo.findOne.mockResolvedValue(mockBudget);
      await expect(service.getBudgetSummary('other-user', 'b1')).rejects.toThrow(ForbiddenException);
    });

    it('returns a full summary when authorized', async () => {
      budgetRepo.findOne.mockResolvedValue(mockBudget);
      
      const summary = await service.getBudgetSummary('user-1', 'b1');
      
      expect(summary).toBeDefined();
      expect(summary?.runningBalance).toBe(0); // 1000 income - 1000 expense from mocks
      expect(summary?.totalAllocation).toBe(10000);
      expect(summary?.remainingBalance).toBe(9000); // 10000 allocation - 1000 expense
      expect(summary?.categoryUtilization).toHaveLength(1);
      expect(summary?.categoryUtilization[0].category).toBe('Food');
      expect(summary?.categoryUtilization[0].spent).toBe(1000);
    });

    it('returns null if budgetId is missing', async () => {
      const result = await service.getBudgetSummary('user-1', '');
      expect(result).toBeNull();
    });
  });
});
