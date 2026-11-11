import { Test, TestingModule } from '@nestjs/testing';
import { FeesService } from './fees.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('FeesService', () => {
  let service: FeesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    platformFeeConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeeConfig', () => {
    it('should return existing platform fee configuration', async () => {
      mockPrismaService.platformFeeConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        commission_rate: 10.0,
        applies_to_profit: true,
        description: 'Test fee config',
        updated_at: new Date('2026-01-01'),
      });

      const result = await service.getFeeConfig();

      expect(result.success).toBe(true);
      expect(result.data.commission_rate).toBe('10');
      expect(result.data.applies_to_profit).toBe(true);
    });

    it('should create default configuration if none exists', async () => {
      mockPrismaService.platformFeeConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.platformFeeConfig.create.mockResolvedValue({
        id: 'config-default',
        commission_rate: 10.0,
        applies_to_profit: true,
        description: 'Default platform commission on net winning profit',
        updated_at: new Date('2026-01-01'),
      });

      const result = await service.getFeeConfig();

      expect(mockPrismaService.platformFeeConfig.create).toHaveBeenCalledWith({
        data: {
          commission_rate: 10.0,
          applies_to_profit: true,
          description: 'Default platform commission on net winning profit',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.commission_rate).toBe('10');
    });
  });

  describe('updateFeeConfig', () => {
    it('should update existing configuration', async () => {
      mockPrismaService.platformFeeConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        commission_rate: 10.0,
        applies_to_profit: true,
        description: 'Old description',
      });
      mockPrismaService.platformFeeConfig.update.mockResolvedValue({
        id: 'config-1',
        commission_rate: 7.5,
        applies_to_profit: true,
        description: 'Updated rate',
        updated_at: new Date('2026-01-02'),
      });

      const result = await service.updateFeeConfig(
        { commission_rate: 7.5, description: 'Updated rate' },
        'admin-user',
      );

      expect(mockPrismaService.platformFeeConfig.update).toHaveBeenCalledWith({
        where: { id: 'config-1' },
        data: {
          commission_rate: 7.5,
          description: 'Updated rate',
          updated_by: 'admin-user',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.commission_rate).toBe('7.5');
    });
  });
});
