import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;
  const mockUser = { 
    id: 'user-1', 
    email: 'test@example.com', 
    displayName: 'Test', 
    password: 'hashed', 
    createdAt: new Date() 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { 
          provide: getRepositoryToken(User), 
          useValue: { 
            create: jest.fn(), 
            save: jest.fn(), 
            findOne: jest.fn() 
          } 
        },
      ],
    }).compile();
    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('throws Conflict when email exists', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      await expect(service.create('test@example.com', 'password', 'Test')).rejects.toThrow(ConflictException);
    });

    it('saves user when email unique', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser);
      repo.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      
      const result = await service.create('new@example.com', 'plainpass', 'Name');
      expect(repo.save).toHaveBeenCalled();
      expect(result.password).toBe('hashed');
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result).toEqual(mockUser);
    });

    it('throws NotFound when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('validatePassword', () => {
    it('returns true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validatePassword(mockUser as any, 'pass');
      expect(result).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('updates displayName and email', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.save.mockResolvedValue({ ...mockUser, displayName: 'New Name' });

      const result = await service.updateProfile('user-1', { displayName: 'New Name' });
      expect(result.displayName).toBe('New Name');
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws Conflict if updating to an existing email', async () => {
      repo.findOne.mockResolvedValueOnce(mockUser); // for findById
      repo.findOne.mockResolvedValueOnce({ id: 'user-2' }); // for email search
      
      await expect(service.updateProfile('user-1', { email: 'used@email.com' }))
        .rejects.toThrow(ConflictException);
    });
  });
});
