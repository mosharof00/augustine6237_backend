import { Test, TestingModule } from '@nestjs/testing';
import { GamingService } from './gaming.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GamingService', () => {
  let service: GamingService;

  const mockPrismaService = {
    bet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gamingMatchCheck: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    betDispute: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GamingService>(GamingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitScore', () => {
    it('should throw NotFoundException if bet not found', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(null);

      await expect(
        service.submitScore('u1', 'b_none', {
          my_score: 3,
          opponent_score: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return AWAITING_OPPONENT when only 1 player has submitted', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({
        id: 'b1',
        participants: [],
      });
      mockPrismaService.gamingMatchCheck.upsert.mockResolvedValue({});
      mockPrismaService.gamingMatchCheck.findMany.mockResolvedValue([
        {
          player_id: 'u1',
          my_score: 3,
          opponent_score: 1,
        },
      ]);

      const res = await service.submitScore('u1', 'b1', {
        my_score: 3,
        opponent_score: 1,
      });

      expect(res.status).toBe('AWAITING_OPPONENT');
      expect(res.my_score).toBe(3);
    });

    it('should auto-resolve and declare winner when dual scores match', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({
        id: 'b1',
        participants: [{ user_id: 'u1', side: 'BACK' }],
      });
      mockPrismaService.gamingMatchCheck.upsert.mockResolvedValue({});
      mockPrismaService.gamingMatchCheck.findMany.mockResolvedValue([
        { player_id: 'u1', my_score: 3, opponent_score: 1 },
        { player_id: 'u2', my_score: 1, opponent_score: 3 },
      ]);

      const res = await service.submitScore('u2', 'b1', {
        my_score: 1,
        opponent_score: 3,
      });

      expect(res.status).toBe('MATCHED');
      expect(res.is_auto_resolved).toBe(true);
      expect(res.winner_id).toBe('u1');
      expect(mockPrismaService.bet.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          winning_side: 'BACK',
        }),
      });
    });

    it('should escalate into dispute when dual scores conflict', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({
        id: 'b1',
        participants: [],
      });
      mockPrismaService.gamingMatchCheck.upsert.mockResolvedValue({});
      mockPrismaService.gamingMatchCheck.findMany.mockResolvedValue([
        { player_id: 'u1', my_score: 3, opponent_score: 1 },
        { player_id: 'u2', my_score: 2, opponent_score: 0 },
      ]);
      mockPrismaService.betDispute.findFirst.mockResolvedValue(null);
      mockPrismaService.betDispute.create.mockResolvedValue({
        id: 'disp_conflict',
      });

      const res = await service.submitScore('u2', 'b1', {
        my_score: 2,
        opponent_score: 0,
      });

      expect(res.status).toBe('MISMATCH');
      expect(res.is_auto_disputed).toBe(true);
      expect(res.dispute_id).toBe('disp_conflict');
      expect(mockPrismaService.bet.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { escrow_status: 'DISPUTED' },
      });
    });
  });

  describe('getMatchCheck', () => {
    it('should return submissions and status', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrismaService.gamingMatchCheck.findMany.mockResolvedValue([
        {
          player_id: 'u1',
          gamertag: 'Alex_PSN',
          platform: 'PLAYSTATION',
          my_score: 3,
          opponent_score: 1,
          proof_url: null,
          created_at: new Date('2026-11-11'),
          player: { name: 'Alex Mercer' },
        },
      ]);

      const res = await service.getMatchCheck('b1');
      expect(res.bet_id).toBe('b1');
      expect(res.match_status).toBe('AWAITING_OPPONENT');
      expect(res.submissions).toHaveLength(1);
    });
  });
});
