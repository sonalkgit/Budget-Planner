import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test',
    password: 'hashed',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create user and return auth response', async () => {
      usersService.create.mockResolvedValue(mockUser as User);
      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      });
      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test',
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com' },
        expect.any(Object),
      );
      expect(result.access_token).toBe('fake-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      usersService.validatePassword.mockResolvedValue(true);
      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.access_token).toBe('fake-token');
    });

    it('should throw when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nope@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when password invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      usersService.validatePassword.mockResolvedValue(false);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
