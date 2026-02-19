import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: any;

  const mockUser: any = { id: 'u1' };
  const mockDto = { budgetId: 'b1', type: 'expense' as const, amount: 100, category: 'Food' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            findAllByBudget: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get(TransactionsService);
  });

  it('create calls service.create', async () => {
    await controller.create(mockUser, mockDto);
    expect(service.create).toHaveBeenCalledWith(mockUser, mockDto);
  });

  it('findAll calls service.findAllByBudget', async () => {
    await controller.findAll(mockUser, 'b1');
    expect(service.findAllByBudget).toHaveBeenCalledWith('b1', mockUser);
  });

  it('findAll returns empty array if no budgetId', async () => {
    const result = await controller.findAll(mockUser, '');
    expect(result).toEqual([]);
  });
});
