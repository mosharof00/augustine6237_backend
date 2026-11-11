import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DisputesService', () => {
  let service: DisputesService;

  const mockPrismaService = {
    bet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    betDispute: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDispute', () => {
    it('should throw NotFoundException if bet not found', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(null);

      await expect(
        service.createDispute('u1', {
          bet_id: 'b_none',
          reason: 'INCORRECT_RESULT',
          description: 'Official report mismatch',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject duplicate active disputes from same creator', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrismaService.betDispute.findFirst.mockResolvedValue({
        id: 'd_existing',
      });

      await expect(
        service.createDispute('u1', {
          bet_id: 'b1',
          reason: 'INCORRECT_RESULT',
          description: 'Official report mismatch',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create dispute and update bet escrow status to DISPUTED', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrismaService.betDispute.findFirst.mockResolvedValue(null);
      mockPrismaService.betDispute.create.mockResolvedValue({
        id: 'disp_1',
        bet_id: 'b1',
        reason: 'INCORRECT_RESULT',
        status: 'OPEN',
        evidence_url: 'https://proof.pdf',
        created_at: new Date('2026-11-11'),
      });

      const res = await service.createDispute('u1', {
        bet_id: 'b1',
        reason: 'INCORRECT_RESULT',
        description: 'Referee whistle',
        evidence_url: 'https://proof.pdf',
      });

      expect(res.dispute_id).toBe('disp_1');
      expect(res.status).toBe('OPEN');
      expect(mockPrismaService.bet.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { escrow_status: 'DISPUTED' },
      });
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute and overturn result when requested', async () => {
      mockPrismaService.betDispute.findUnique.mockResolvedValue({
        id: 'disp_1',
        bet_id: 'b1',
      });
      mockPrismaService.betDispute.update.mockResolvedValue({
        id: 'disp_1',
        bet_id: 'b1',
        status: 'RESOLVED',
        resolution: 'OVERTURN_RESULT',
        resolution_notes: 'Evidence verified',
        resolved_at: new Date('2026-11-11'),
      });

      const res = await service.resolveDispute('admin_1', 'disp_1', {
        resolution: 'OVERTURN_RESULT',
        resolution_notes: 'Evidence verified',
        new_winning_side: 'BACK',
      });

      expect(res.status).toBe('RESOLVED');
      expect(res.resolution).toBe('OVERTURN_RESULT');
      expect(mockPrismaService.bet.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: {
          winning_side: 'BACK',
          winning_outcome_id: null,
          escrow_status: 'RESOLVED',
        },
      });
    });
  });
});
