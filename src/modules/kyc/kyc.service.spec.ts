import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('KycService', () => {
  let service: KycService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKycStatus', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getKycStatus('u_none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return KYC status with tier limits', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        kyc_status: 'VERIFIED',
        kyc_document_type: 'PASSPORT',
        kyc_document_url: 'https://storage/doc.pdf',
        kyc_submitted_at: new Date('2026-11-10'),
        kyc_verified_at: new Date('2026-11-11'),
      });

      const res = await service.getKycStatus('u1');
      expect(res.user_id).toBe('u1');
      expect(res.kyc_status).toBe('VERIFIED');
      expect(res.can_deposit_large).toBe(true);
      expect(res.can_create_high_stakes).toBe(true);
    });
  });

  describe('submitKyc', () => {
    it('should update user status to PENDING and save document details', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        kyc_status: 'PENDING',
        kyc_document_type: 'PASSPORT',
        kyc_submitted_at: new Date('2026-11-11'),
      });

      const res = await service.submitKyc('u1', {
        document_type: 'PASSPORT',
        document_number: 'P12345678',
        document_url: 'https://storage/doc.jpg',
      });

      expect(res.kyc_status).toBe('PENDING');
      expect(res.document_type).toBe('PASSPORT');
      expect(res.submitted_at).toBeDefined();
    });
  });

  describe('reviewKyc', () => {
    it('should update user to VERIFIED when approved', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        kyc_status: 'VERIFIED',
        kyc_verified_at: new Date('2026-11-11'),
      });

      const res = await service.reviewKyc('admin_1', {
        user_id: 'u1',
        status: 'VERIFIED',
      });

      expect(res.user_id).toBe('u1');
      expect(res.kyc_status).toBe('VERIFIED');
      expect(res.verified_at).toBeDefined();
    });
  });
});
