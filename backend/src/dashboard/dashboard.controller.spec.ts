import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getBudgetSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  it('getSummary calls service.getBudgetSummary', async () => {
    const mockUser: any = { id: 'u1' };
    await controller.getSummary(mockUser, 'b1');
    expect(service.getBudgetSummary).toHaveBeenCalledWith('u1', 'b1');
  });
});
