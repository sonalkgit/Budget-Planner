import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BudgetsService } from './budgets.service';
import { Budget } from './entities/budget.entity';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let repo: any;

  const mockUser: any = { id: 'user-1', email: 'u@u.com' };
  const mockBudget = {
    id: 'budget-1',
    userId: 'user-1',
    name: 'Jan Budget',
    totalAllocation: '10000.00',
    categoryLimits: { Food: '3000.00', Transport: '2000.00' },
    month: '2025-01-01',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BudgetsService);
    repo = module.get(getRepositoryToken(Budget));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create budget with category limits and transform month', async () => {
      const created = { ...mockBudget };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);
      
      const result = await service.create('user-1', {
        name: 'Jan Budget',
        totalAllocation: 10000,
        month: '2025-01',
        categoryLimits: { Food: 3000 },
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          name: 'Jan Budget',
          month: '2025-01-01',
          totalAllocation: '10000.00'
        }),
      );
      expect(result.month).toBe('2025-01-01');
    });

    it('should handle missing category limits during creation', async () => {
      const created = { ...mockBudget, categoryLimits: {} };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.create('user-1', {
        name: 'Empty Budget',
        totalAllocation: 5000,
        month: '2025-02',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryLimits: {},
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all budgets for a user', async () => {
      repo.find.mockResolvedValue([mockBudget]);
      const result = await service.findAllByUser('user-1');
      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-1' }
      }));
    });
  });

  describe('findOne', () => {
    it('should return budget if user is owner', async () => {
      repo.findOne.mockResolvedValue(mockBudget);
      const result = await service.findOne('budget-1', mockUser);
      expect(result.id).toBe('budget-1');
    });

    it('should throw NotFoundException if budget does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('budget-1', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      repo.findOne.mockResolvedValue(mockBudget);
      const otherUser = { id: 'user-2' };
      await expect(service.findOne('budget-1', otherUser as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update budget and transform month', async () => {
      repo.findOne.mockResolvedValue(mockBudget);
      repo.save.mockResolvedValue({ ...mockBudget, name: 'Updated' });

      const result = await service.update('budget-1', mockUser, {
        name: 'Updated',
        month: '2025-12'
      });

      expect(result.name).toBe('Updated');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
        month: '2025-12-01'
      }));
    });
  });

  describe('remove', () => {
    it('should remove budget', async () => {
      repo.findOne.mockResolvedValue(mockBudget);
      repo.remove.mockResolvedValue(mockBudget);

      await service.remove('budget-1', mockUser);
      expect(repo.remove).toHaveBeenCalled();
    });
  });
});
