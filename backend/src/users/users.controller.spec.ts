import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('getMe calls service.findById', async () => {
    const mockUser: any = { id: 'u1' };
    await controller.getMe(mockUser);
    expect(service.findById).toHaveBeenCalledWith('u1');
  });

  it('updateProfile calls service.updateProfile', async () => {
    const mockUser: any = { id: 'u1' };
    const dto = { displayName: 'New' };
    await controller.updateProfile(mockUser, dto);
    expect(service.updateProfile).toHaveBeenCalledWith('u1', dto);
  });
});
