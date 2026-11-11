import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { UserRepository } from 'src/common/repository/user/user.repository';
import { UcodeRepository } from 'src/common/repository/ucode/ucode.repository';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMailService = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  const mockUserRepository = {
    exist: jest.fn().mockResolvedValue(false),
    createUser: jest.fn().mockResolvedValue({ success: true }),
    getUserDetails: jest
      .fn()
      .mockResolvedValue({ id: 'user-1', type: 'CLIENT' }),
  };

  const mockUcodeRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: UcodeRepository, useValue: mockUcodeRepository },
        { provide: getRedisConnectionToken(), useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
