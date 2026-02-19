import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: any;

  const mockUser: any = { id: 'u1' };
  const mockDto = { name: 'Jan', totalAllocation: 1000, month: '2025-01' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get(BudgetsService);
  });

  it('create calls service.create', async () => {
    await controller.create(mockUser, mockDto);
    expect(service.create).toHaveBeenCalledWith('u1', mockDto);
  });

  it('findAll calls service.findAllByUser', async () => {
    await controller.findAll(mockUser);
    expect(service.findAllByUser).toHaveBeenCalledWith('u1');
  });

  it('findOne calls service.findOne', async () => {
    await controller.findOne(mockUser, 'b1');
    expect(service.findOne).toHaveBeenCalledWith('b1', mockUser);
  });
});
