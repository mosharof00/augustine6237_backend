import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;

  const mockBet = {
    id: 'bet_101',
    title: 'Arsenal vs Chelsea',
    category: 'SPORTS',
    back_pool: 600,
    oppose_pool: 300,
    matched_pool: 300,
    outcomes: [],
    participants: [{ id: 'p1' }, { id: 'p2' }],
    comments: [],
  };

  beforeEach(async () => {
    prisma = {
      bet: {
        findUnique: jest.fn(),
      },
      betAiInsight: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'insight_1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('researchBet', () => {
    it('throws NotFoundException if bet does not exist', async () => {
      prisma.bet.findUnique.mockResolvedValue(null);
      await expect(
        service.researchBet('u1', { bet_id: 'non_existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('generates contextual research and saves insight in database', async () => {
      prisma.bet.findUnique.mockResolvedValue(mockBet);

      const result = await service.researchBet('u1', {
        bet_id: 'bet_101',
        prompt: 'Check key injuries',
      });

      expect(result.bet_id).toBe('bet_101');
      expect(result.topic).toBe('Arsenal vs Chelsea');
      expect(result.summary).toContain('Arsenal vs Chelsea');
      expect(result.market_sentiment.back_percentage).toBe(66.7);
      expect(result.market_sentiment.oppose_percentage).toBe(33.3);
      expect(result.suggested_stance).toBe('BACK');
      expect(result.confidence_score).toBe(0.86);
      expect(result.key_factors.length).toBeGreaterThan(0);
      expect(result.sources).toContain('Opta Sports Statistics 2026');
      expect(prisma.betAiInsight.upsert).toHaveBeenCalled();
    });
  });

  describe('chat', () => {
    it('provides conversational bet advice when bet_id is provided', async () => {
      prisma.bet.findUnique.mockResolvedValue(mockBet);

      const result = await service.chat('u1', {
        bet_id: 'bet_101',
        query: 'What are the main risks?',
      });

      expect(result.reply).toContain('Key risks for');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
    });

    it('provides general betting intelligence when no bet_id is provided', async () => {
      const result = await service.chat('u1', {
        query: 'How does peer to peer betting work?',
      });

      expect(result.reply).toContain('BetSocial AI Assistant');
      expect(result.suggestions).toContain(
        'Explore top trending sports markets',
      );
    });
  });

  describe('getBetInsights', () => {
    it('returns cached insight if available in database', async () => {
      prisma.betAiInsight.findUnique.mockResolvedValue({
        bet_id: 'bet_101',
        topic: 'Arsenal vs Chelsea',
        summary: 'Cached analysis summary',
        suggested_stance: 'BACK',
        confidence_score: 0.82,
        risk_level: 'MODERATE',
        key_factors: ['Factor 1'],
        market_sentiment: { back_percentage: 65 },
        sources: ['Opta Sports'],
      });

      const result = await service.getBetInsights('bet_101');
      expect(result.summary).toBe('Cached analysis summary');
      expect(result.confidence_score).toBe(0.82);
    });
  });
});
