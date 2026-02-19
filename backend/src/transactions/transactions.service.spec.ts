import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { BudgetsService } from '../budgets/budgets.service';
import { Transaction } from './entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: any;
  let budgetsService: any;

  const mockUser: any = { id: 'user-1' };
  const mockBudget: any = {
    id: 'budget-1',
    userId: 'user-1',
    totalAllocation: '10000.00',
    categoryLimits: { Food: '3000.00' },
  };
  const mockTransaction = {
    id: 'tx-1',
    budgetId: 'budget-1',
    type: 'expense',
    amount: '500.00',
    category: 'Food',
    note: null,
    createdAt: new Date(),
    budget: mockBudget,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ sum: '0' }),
            })),
          },
        },
        {
          provide: BudgetsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    transactionRepo = module.get(getRepositoryToken(Transaction));
    budgetsService = module.get(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create expense when under category limit', async () => {
      budgetsService.findOne.mockResolvedValue(mockBudget);
      transactionRepo.create.mockReturnValue(mockTransaction);
      transactionRepo.save.mockResolvedValue(mockTransaction);
      
      const result = await service.create(mockUser, {
        budgetId: 'budget-1',
        type: 'expense',
        amount: 200,
        category: 'Food',
      });
      expect(transactionRepo.save).toHaveBeenCalled();
      expect(result.amount).toBe('500.00');
    });

    it('should throw BadRequest when expense exceeds category limit', async () => {
      budgetsService.findOne.mockResolvedValue(mockBudget);
      transactionRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '2900' }),
      } as any);

      await expect(service.create(mockUser, {
        budgetId: 'budget-1',
        type: 'expense',
        amount: 200,
        category: 'Food',
      })).rejects.toThrow(BadRequestException);
    });

    it('should allow income even if it exceeds limits', async () => {
      budgetsService.findOne.mockResolvedValue(mockBudget);
      const income = { ...mockTransaction, type: 'income' };
      transactionRepo.create.mockReturnValue(income);
      transactionRepo.save.mockResolvedValue(income);

      const result = await service.create(mockUser, {
        budgetId: 'budget-1',
        type: 'income',
        amount: 5000,
        category: 'Salary',
      });
      expect(transactionRepo.save).toHaveBeenCalled();
      expect(result.type).toBe('income');
    });
  });

  describe('findAllByBudget', () => {
    it('should return all transactions for a budget', async () => {
      budgetsService.findOne.mockResolvedValue(mockBudget);
      transactionRepo.find.mockResolvedValue([mockTransaction]);
      const result = await service.findAllByBudget('budget-1', mockUser);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return transaction if user is owner', async () => {
      transactionRepo.findOne.mockResolvedValue(mockTransaction);
      const result = await service.findOne('tx-1', mockUser);
      expect(result.id).toBe('tx-1');
    });

    it('should throw Forbidden if user is not owner', async () => {
      transactionRepo.findOne.mockResolvedValue(mockTransaction);
      const otherUser = { id: 'user-2' };
      await expect(service.findOne('tx-1', otherUser as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update an existing transaction', async () => {
      transactionRepo.findOne.mockResolvedValue(mockTransaction);
      budgetsService.findOne.mockResolvedValue(mockBudget);
      transactionRepo.save.mockResolvedValue({ ...mockTransaction, amount: '300.00' });
      
      const result = await service.update('tx-1', mockUser, { amount: 300 });
      expect(transactionRepo.save).toHaveBeenCalled();
      expect(result.amount).toBe('300.00');
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      transactionRepo.findOne.mockResolvedValue(mockTransaction);
      transactionRepo.remove.mockResolvedValue(mockTransaction);
      
      await service.remove('tx-1', mockUser);
      expect(transactionRepo.remove).toHaveBeenCalled();
    });
  });
});
