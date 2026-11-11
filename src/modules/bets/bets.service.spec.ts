import { Test, TestingModule } from '@nestjs/testing';
import { BetsService } from './bets.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('BetsService', () => {
  let service: BetsService;

  const mockPrismaService = {
    bet: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    betParticipant: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    betOutcome: {
      create: jest.fn(),
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    betComment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    platformFeeConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BetsService>(BetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicBets', () => {
    it('should return public bets matching query criteria', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([
        {
          id: 'bet-1',
          title: 'Arsenal vs Chelsea',
          description: 'Match winner',
          category: 'SPORTS',
          creator_id: 'u-1',
          status: 'ACTIVE',
          is_private: false,
          deadline: new Date('2026-11-12T19:00:00Z'),
          total_pool: 1500,
          back_pool: 950,
          oppose_pool: 550,
          created_at: new Date('2026-11-10T12:00:00Z'),
          creator: {
            id: 'u-1',
            name: 'Alex',
            username: 'alexm',
            avatar: null,
          },
          _count: { comments: 4 },
        },
      ]);

      const res = await service.getPublicBets({
        category: 'SPORTS',
        sort: 'trending',
      });
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('bet-1');
      expect(res.data[0].total_pool).toBe('1500');
      expect(res.data[0].back_pool).toBe('950');
      expect(res.data[0].oppose_pool).toBe('550');
      expect(res.data[0].comments_count).toBe(4);
    });
  });

  describe('getBetById', () => {
    it('should throw NotFoundException if bet does not exist', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);

      await expect(service.getBetById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return detailed bet if found', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue({
        id: 'bet-1',
        title: 'Arsenal vs Chelsea',
        description: 'Match winner',
        category: 'SPORTS',
        creator_id: 'u-1',
        status: 'ACTIVE',
        is_private: false,
        deadline: new Date('2026-11-12T19:00:00Z'),
        total_pool: 1500,
        back_pool: 950,
        oppose_pool: 550,
        created_at: new Date('2026-11-10T12:00:00Z'),
        creator: {
          id: 'u-1',
          name: 'Alex',
          username: 'alexm',
          avatar: null,
        },
        _count: { comments: 2 },
      });

      const res = await service.getBetById('bet-1');
      expect(res.success).toBe(true);
      expect(res.data.id).toBe('bet-1');
      expect(res.data.creator.username).toBe('alexm');
    });
  });

  describe('createBet', () => {
    it('should create a new bet with back side initial stake', async () => {
      mockPrismaService.bet.create.mockResolvedValue({
        id: 'bet-new',
        title: 'US Presidential Election',
        description: 'Democrat victory',
        category: 'POLITICS',
        creator_id: 'u-1',
        status: 'ACTIVE',
        is_private: false,
        deadline: new Date('2026-11-15T23:59:59Z'),
        total_pool: 100,
        back_pool: 100,
        oppose_pool: 0,
        created_at: new Date('2026-11-11T08:00:00Z'),
        creator: {
          id: 'u-1',
          name: 'Alex',
          username: 'alexm',
          avatar: null,
        },
      });

      const res = await service.createBet('u-1', {
        title: 'US Presidential Election',
        description: 'Democrat victory',
        category: 'POLITICS',
        deadline: '2026-11-15T23:59:59Z',
        initial_stake: 100,
        initial_side: 'BACK',
      });

      expect(res.success).toBe(true);
      expect(res.data.id).toBe('bet-new');
      expect(res.data.back_pool).toBe('100');
      expect(res.data.oppose_pool).toBe('0');
      expect(res.data.total_pool).toBe('100');
    });

    it('should create a new bet with oppose side initial stake', async () => {
      mockPrismaService.bet.create.mockResolvedValue({
        id: 'bet-oppose',
        title: 'US Presidential Election',
        description: 'Republican victory',
        category: 'POLITICS',
        creator_id: 'u-1',
        status: 'ACTIVE',
        is_private: false,
        deadline: new Date('2026-11-15T23:59:59Z'),
        total_pool: 50,
        back_pool: 0,
        oppose_pool: 50,
        created_at: new Date('2026-11-11T08:00:00Z'),
        creator: {
          id: 'u-1',
          name: 'Alex',
          username: 'alexm',
          avatar: null,
        },
      });

      const res = await service.createBet('u-1', {
        title: 'US Presidential Election',
        description: 'Republican victory',
        category: 'POLITICS',
        deadline: '2026-11-15T23:59:59Z',
        initial_stake: 50,
        initial_side: 'OPPOSE',
      });

      expect(res.success).toBe(true);
      expect(res.data.back_pool).toBe('0');
      expect(res.data.oppose_pool).toBe('50');
    });
  });

  describe('getBetComments', () => {
    it('should throw NotFoundException if bet not found', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);

      await expect(service.getBetComments('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return chronological comments for a bet', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue({ id: 'bet-1' });
      mockPrismaService.betComment.findMany.mockResolvedValue([
        {
          id: 'comm-1',
          bet_id: 'bet-1',
          content: 'Backing Arsenal to win!',
          stance: 'BACK',
          created_at: new Date('2026-11-10T16:30:00Z'),
          author: {
            id: 'u1',
            name: 'Alex',
            username: 'alexm',
            avatar: null,
          },
        },
      ]);

      const res = await service.getBetComments('bet-1');
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('comm-1');
      expect(res.data[0].stance).toBe('BACK');
      expect(res.data[0].author.name).toBe('Alex');
    });
  });

  describe('createBetComment', () => {
    it('should throw NotFoundException if bet not found', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);

      await expect(
        service.createBetComment('b-404', 'u-1', { content: 'hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return comment with stance', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue({ id: 'bet-1' });
      mockPrismaService.betComment.create.mockResolvedValue({
        id: 'comm-new',
        bet_id: 'bet-1',
        content: 'Chelsea will equalize!',
        stance: 'OPPOSE',
        created_at: new Date('2026-11-10T16:35:00Z'),
        author: {
          id: 'u2',
          name: 'Sam',
          username: 'samc',
          avatar: null,
        },
      });

      const res = await service.createBetComment('bet-1', 'u2', {
        content: 'Chelsea will equalize!',
        stance: 'OPPOSE',
      });

      expect(res.success).toBe(true);
      expect(res.data.id).toBe('comm-new');
      expect(res.data.stance).toBe('OPPOSE');
      expect(res.data.author.name).toBe('Sam');
    });
  });

  describe('deleteBetComment', () => {
    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.betComment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteBetComment('b-1', 'c-404', 'u-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author', async () => {
      mockPrismaService.betComment.findFirst.mockResolvedValue({
        id: 'c-1',
        author_id: 'other-user',
      });

      await expect(
        service.deleteBetComment('b-1', 'c-1', 'u-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete comment when user is author', async () => {
      mockPrismaService.betComment.findFirst.mockResolvedValue({
        id: 'c-1',
        author_id: 'u-1',
      });
      mockPrismaService.betComment.delete.mockResolvedValue({});

      const res = await service.deleteBetComment('b-1', 'c-1', 'u-1');
      expect(res.success).toBe(true);
      expect(mockPrismaService.betComment.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
    });
  });

  describe('Private Bets & Invite Links (Slice 6)', () => {
    describe('createBet (private)', () => {
      it('should create private bet with auto-generated invite code and register initial participant', async () => {
        mockPrismaService.bet.create.mockImplementation((args) => ({
          id: 'bet-priv-1',
          title: args.data.title,
          description: args.data.description,
          category: args.data.category,
          creator_id: args.data.creator_id,
          status: 'ACTIVE',
          is_private: true,
          invite_code: args.data.invite_code,
          deadline: args.data.deadline,
          total_pool: 50,
          back_pool: 50,
          oppose_pool: 0,
          created_at: new Date('2026-11-11T08:00:00Z'),
          creator: {
            id: 'u-1',
            name: 'Alex',
            username: 'alexm',
            avatar: null,
          },
        }));
        mockPrismaService.betParticipant.create.mockResolvedValue({});

        const res = await service.createBet('u-1', {
          title: 'Private P2P match wager',
          category: 'SPORTS',
          deadline: '2026-11-16T08:00:00Z',
          is_private: true,
          initial_stake: 50,
          initial_side: 'BACK',
        });

        expect(res.success).toBe(true);
        expect(res.data.is_private).toBe(true);
        expect(res.data.invite_code).toMatch(/^BET-[A-Z0-9]{6}$/);
        expect(mockPrismaService.betParticipant.create).toHaveBeenCalledWith({
          data: {
            bet_id: 'bet-priv-1',
            user_id: 'u-1',
            side: 'BACK',
            stake: 50,
          },
        });
      });
    });

    describe('getBetByInviteCode', () => {
      it('should throw NotFoundException if invite code is not found', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue(null);

        await expect(
          service.getBetByInviteCode('INVALID-CODE'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should return bet and its participant roster when invite code is valid', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-priv-1',
          title: 'Private Bet',
          description: null,
          category: 'SPORTS',
          creator_id: 'u-1',
          status: 'ACTIVE',
          is_private: true,
          invite_code: 'BET-9K2L8X',
          deadline: new Date('2026-11-16T08:00:00Z'),
          total_pool: 100,
          back_pool: 50,
          oppose_pool: 50,
          created_at: new Date('2026-11-11T08:00:00Z'),
          creator: {
            id: 'u-1',
            name: 'Alex',
            username: 'alexm',
            avatar: null,
          },
          participants: [
            {
              id: 'part-1',
              user_id: 'u-1',
              side: 'BACK',
              stake: 50,
              created_at: new Date('2026-11-11T08:00:00Z'),
              user: {
                id: 'u-1',
                name: 'Alex',
                username: 'alexm',
                avatar: null,
              },
            },
          ],
          _count: { comments: 2 },
        });

        const res = await service.getBetByInviteCode('BET-9K2L8X');
        expect(res.success).toBe(true);
        expect(res.data.invite_code).toBe('BET-9K2L8X');
        expect(res.data.participants).toHaveLength(1);
        expect(res.data.participants[0].side).toBe('BACK');
      });
    });

    describe('joinBetByInviteCode', () => {
      it('should throw NotFoundException if invite code is invalid', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue(null);

        await expect(
          service.joinBetByInviteCode('INVALID', 'u-2', {
            side: 'OPPOSE',
            stake: 50,
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if bet is closed or past deadline', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-1',
          status: 'CLOSED',
          deadline: new Date('2026-11-16T08:00:00Z'),
        });

        await expect(
          service.joinBetByInviteCode('BET-1', 'u-2', {
            side: 'OPPOSE',
            stake: 50,
          }),
        ).rejects.toThrow(ForbiddenException);

        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-1',
          status: 'ACTIVE',
          deadline: new Date('2020-01-01T00:00:00Z'),
        });

        await expect(
          service.joinBetByInviteCode('BET-1', 'u-2', {
            side: 'OPPOSE',
            stake: 50,
          }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should successfully join bet, increment oppose pool, and upsert participant', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-1',
          status: 'ACTIVE',
          deadline: new Date('2030-01-01T00:00:00Z'),
        });
        mockPrismaService.bet.update.mockResolvedValue({
          id: 'bet-1',
          total_pool: 100,
          back_pool: 50,
          oppose_pool: 50,
        });
        mockPrismaService.betParticipant.upsert.mockResolvedValue({
          id: 'part-2',
          bet_id: 'bet-1',
          user_id: 'u-2',
          side: 'OPPOSE',
          stake: 50,
          created_at: new Date('2026-11-11T08:45:00Z'),
          user: {
            id: 'u-2',
            name: 'Jordan',
            username: 'jordanc',
            avatar: null,
          },
        });

        const res = await service.joinBetByInviteCode('BET-9K2L8X', 'u-2', {
          side: 'OPPOSE',
          stake: 50,
        });

        expect(res.success).toBe(true);
        expect(res.data.bet.total_pool).toBe('100');
        expect(res.data.participant.side).toBe('OPPOSE');
        expect(mockPrismaService.bet.update).toHaveBeenCalledWith({
          where: { id: 'bet-1' },
          data: {
            total_pool: { increment: 50 },
            oppose_pool: { increment: 50 },
          },
          include: {
            outcomes: {
              orderBy: { created_at: 'asc' },
            },
          },
        });
      });
    });

    describe('getBetParticipants', () => {
      it('should throw NotFoundException if bet is missing', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue(null);

        await expect(service.getBetParticipants('bet-none')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should return participants for a bet', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({ id: 'bet-1' });
        mockPrismaService.betParticipant.findMany.mockResolvedValue([
          {
            id: 'part-1',
            bet_id: 'bet-1',
            user_id: 'u-1',
            side: 'BACK',
            stake: 50,
            created_at: new Date('2026-11-11T08:00:00Z'),
            user: {
              id: 'u-1',
              name: 'Alex',
              username: 'alexm',
              avatar: null,
            },
          },
        ]);

        const res = await service.getBetParticipants('bet-1');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(1);
        expect(res.data[0].side).toBe('BACK');
      });
    });

    describe('Slice 7: Custom Outcome and Staking', () => {
      it('should create custom multi-outcome bet and seed outcomes', async () => {
        mockPrismaService.bet.create.mockResolvedValue({
          id: 'bet-custom-1',
          title: 'Premier League Winner',
          description: null,
          category: 'SPORTS',
          bet_type: 'CUSTOM',
          creator_id: 'u-1',
          status: 'ACTIVE',
          is_private: false,
          deadline: new Date('2027-05-25T18:00:00Z'),
          total_pool: 100,
          back_pool: 0,
          oppose_pool: 0,
          created_at: new Date('2026-11-11T09:00:00Z'),
          creator: {
            id: 'u-1',
            name: 'Alex',
            username: 'alexm',
            avatar: null,
          },
          outcomes: [
            {
              id: 'out-1',
              bet_id: 'bet-custom-1',
              title: 'Arsenal',
              pool: 100,
              is_winner: null,
            },
            {
              id: 'out-2',
              bet_id: 'bet-custom-1',
              title: 'Man City',
              pool: 0,
              is_winner: null,
            },
          ],
        });

        mockPrismaService.betOutcome.create.mockImplementation((args: any) =>
          Promise.resolve({
            id: args.data.title === 'Arsenal' ? 'out-1' : 'out-2',
            ...args.data,
          }),
        );
        mockPrismaService.betParticipant.create.mockResolvedValue({
          id: 'part-custom-1',
          bet_id: 'bet-custom-1',
          user_id: 'u-1',
          side: 'Arsenal',
          stake: 100,
        });

        const res = await service.createBet('u-1', {
          title: 'Premier League Winner',
          category: 'SPORTS',
          bet_type: 'CUSTOM',
          outcomes: ['Arsenal', 'Man City'],
          initial_stake: 100,
          initial_outcome: 'Arsenal',
          deadline: '2027-05-25T18:00:00Z',
        });

        expect(res.success).toBe(true);
        expect(res.data.bet_type).toBe('CUSTOM');
        expect(res.data.outcomes).toHaveLength(2);
        expect(mockPrismaService.betOutcome.create).toHaveBeenCalledTimes(2);
      });

      it('should place a stake on a custom outcome', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-custom-1',
          status: 'ACTIVE',
          deadline: new Date(Date.now() + 1000000),
          outcomes: [
            {
              id: 'out-1',
              bet_id: 'bet-custom-1',
              title: 'Arsenal',
              pool: 100,
            },
            { id: 'out-2', bet_id: 'bet-custom-1', title: 'Man City', pool: 0 },
          ],
        });

        mockPrismaService.betOutcome.findFirst.mockResolvedValue({
          id: 'out-2',
          bet_id: 'bet-custom-1',
          title: 'Man City',
          pool: 0,
        });

        mockPrismaService.betOutcome.update.mockResolvedValue({
          id: 'out-2',
          pool: 50,
        });

        mockPrismaService.bet.update.mockResolvedValue({
          id: 'bet-custom-1',
          total_pool: 150,
          outcomes: [
            {
              id: 'out-1',
              bet_id: 'bet-custom-1',
              title: 'Arsenal',
              pool: 100,
            },
            {
              id: 'out-2',
              bet_id: 'bet-custom-1',
              title: 'Man City',
              pool: 50,
            },
          ],
        });

        mockPrismaService.betParticipant.upsert.mockResolvedValue({
          id: 'part-2',
          bet_id: 'bet-custom-1',
          user_id: 'u-2',
          outcome_id: 'out-2',
          side: 'Man City',
          stake: 50,
          created_at: new Date('2026-11-11T09:10:00Z'),
          user: {
            id: 'u-2',
            name: 'Jordan',
            username: 'jordanc',
            avatar: null,
          },
        });

        const res = await service.placeStake('bet-custom-1', 'u-2', {
          outcome_id: 'out-2',
          stake: 50,
        });

        expect(res.success).toBe(true);
        expect(res.data.bet.total_pool).toBe('150');
        expect(res.data.participant.side).toBe('Man City');
        expect(mockPrismaService.betOutcome.update).toHaveBeenCalledWith({
          where: { id: 'out-2' },
          data: { pool: { increment: 50 } },
        });
      });

      it('should place a stake on binary side', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-binary-1',
          status: 'ACTIVE',
          deadline: new Date(Date.now() + 1000000),
          outcomes: [],
        });

        mockPrismaService.bet.update.mockResolvedValue({
          id: 'bet-binary-1',
          total_pool: 200,
          back_pool: 150,
          oppose_pool: 50,
          outcomes: [],
        });

        mockPrismaService.betParticipant.upsert.mockResolvedValue({
          id: 'part-3',
          bet_id: 'bet-binary-1',
          user_id: 'u-3',
          side: 'OPPOSE',
          stake: 50,
          created_at: new Date('2026-11-11T09:20:00Z'),
          user: {
            id: 'u-3',
            name: 'Sam',
            username: 'samk',
            avatar: null,
          },
        });

        const res = await service.placeStake('bet-binary-1', 'u-3', {
          side: 'OPPOSE',
          stake: 50,
        });

        expect(res.success).toBe(true);
        expect(res.data.bet.total_pool).toBe('200');
        expect(res.data.participant.side).toBe('OPPOSE');
      });

      it('should return outcomes for a bet', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-custom-1',
          total_pool: 100,
          outcomes: [
            {
              id: 'out-1',
              bet_id: 'bet-custom-1',
              title: 'Arsenal',
              pool: 60,
              is_winner: null,
            },
            {
              id: 'out-2',
              bet_id: 'bet-custom-1',
              title: 'Man City',
              pool: 40,
              is_winner: null,
            },
          ],
        });

        const res = await service.getBetOutcomes('bet-custom-1');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(2);
        expect(res.data[0].percent).toBe(60);
        expect(res.data[1].percent).toBe(40);
      });
    });

    describe('Slice 8: Matched Betting Engine Tests', () => {
      it('should calculate matched and unmatched pools and participant statuses in recalculateBetMatches', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-match-1',
          bet_type: 'BINARY',
          back_pool: 150,
          oppose_pool: 100,
          participants: [
            { id: 'p1', user_id: 'u1', side: 'BACK', stake: 150 },
            { id: 'p2', user_id: 'u2', side: 'OPPOSE', stake: 100 },
          ],
        });

        mockPrismaService.betParticipant.update.mockResolvedValue({});
        mockPrismaService.bet.update.mockResolvedValue({});

        const res = await service.recalculateBetMatches('bet-match-1');

        expect(res).not.toBeNull();
        expect(res?.total_pool).toBe(250);
        expect(res?.matched_pool).toBe(200); // 100 * 2
        expect(res?.unmatched_pool).toBe(50); // 150 - 100
        expect(mockPrismaService.betParticipant.update).toHaveBeenCalledWith({
          where: { id: 'p1' },
          data: {
            matched_stake: 100,
            unmatched_stake: 50,
            match_status: 'PARTIALLY_MATCHED',
          },
        });
        expect(mockPrismaService.betParticipant.update).toHaveBeenCalledWith({
          where: { id: 'p2' },
          data: {
            matched_stake: 100,
            unmatched_stake: 0,
            match_status: 'MATCHED',
          },
        });
      });

      it('should return matched status with live odds and participant roster in getMatchedStatus', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-match-1',
          bet_type: 'BINARY',
          total_pool: 250,
          back_pool: 150,
          oppose_pool: 100,
          matched_pool: 200,
          unmatched_pool: 50,
          participants: [
            {
              id: 'p1',
              user_id: 'u1',
              side: 'BACK',
              stake: 150,
              matched_stake: 100,
              unmatched_stake: 50,
              match_status: 'PARTIALLY_MATCHED',
              refunded_amount: 0,
              user: { id: 'u1', name: 'Alex', username: 'alexm', avatar: null },
            },
          ],
        });

        const res = await service.getMatchedStatus('bet-match-1');
        expect(res.success).toBe(true);
        expect(res.data.bet_id).toBe('bet-match-1');
        expect(res.data.matched_pool).toBe('200.00');
        expect(res.data.unmatched_pool).toBe('50.00');
        expect(res.data.back_odds).toBe('1.67'); // 250 / 150
        expect(res.data.oppose_odds).toBe('2.50'); // 250 / 100
        expect(res.data.participants).toHaveLength(1);
        expect(res.data.participants[0].match_status).toBe('PARTIALLY_MATCHED');
      });

      it('should refund unmatched stakes and credit user wallet in refundUnmatchedStakes', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-match-1',
          creator_id: 'u-admin',
          bet_type: 'BINARY',
          back_pool: 150,
          oppose_pool: 100,
          participants: [
            { id: 'p1', user_id: 'u1', side: 'BACK', stake: 150 },
            { id: 'p2', user_id: 'u2', side: 'OPPOSE', stake: 100 },
          ],
        });

        mockPrismaService.betParticipant.findMany.mockResolvedValue([
          {
            id: 'p1',
            user_id: 'u1',
            stake: 150,
            matched_stake: 100,
            unmatched_stake: 50,
          },
          {
            id: 'p2',
            user_id: 'u2',
            stake: 100,
            matched_stake: 100,
            unmatched_stake: 0,
          },
        ]);

        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.betParticipant.update.mockResolvedValue({});
        mockPrismaService.bet.update.mockResolvedValue({});

        const res = await service.refundUnmatchedStakes(
          'bet-match-1',
          'u-admin',
        );

        expect(res.success).toBe(true);
        expect(res.data.refunded_count).toBe(1);
        expect(res.data.total_refunded).toBe('50.00');
        expect(mockPrismaService.user.update).toHaveBeenCalledWith({
          where: { id: 'u1' },
          data: { balance: { increment: 50 } },
        });
        expect(mockPrismaService.betParticipant.update).toHaveBeenCalledWith({
          where: { id: 'p1' },
          data: {
            unmatched_stake: 0,
            refunded_amount: { increment: 50 },
            match_status: 'MATCHED',
          },
        });
      });
    });

    describe('Slice 9: Escrow & Automated Payout Pool', () => {
      it('should return escrow status and participant payouts in getEscrowStatus', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-escrow-1',
          title: 'Arsenal vs Chelsea',
          status: 'ACTIVE',
          escrow_status: 'LOCKED',
          total_pool: 200,
          matched_pool: 160,
          unmatched_pool: 40,
          payout_pool: 0,
          winning_side: null,
          winning_outcome_id: null,
          resolved_at: null,
          participants: [
            {
              id: 'p1',
              user_id: 'u1',
              side: 'BACK',
              stake: 100,
              matched_stake: 80,
              payout_amount: 0,
              is_winner: null,
              payout_status: 'PENDING',
              user: {
                id: 'u1',
                name: 'Alice',
                username: 'alice',
                avatar: null,
              },
            },
          ],
        });

        const res = await service.getEscrowStatus('bet-escrow-1');
        expect(res.success).toBe(true);
        expect(res.data.bet_id).toBe('bet-escrow-1');
        expect(res.data.total_escrow).toBe('200.00');
        expect(res.data.matched_pool).toBe('160.00');
        expect(res.data.escrow_status).toBe('LOCKED');
        expect(res.data.payouts).toHaveLength(1);
        expect(res.data.payouts[0].matched_stake).toBe('80.00');
      });

      it('should throw BadRequestException if resolving already resolved bet', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-res-1',
          status: 'RESOLVED',
        });

        await expect(
          service.resolveBet('bet-res-1', { winning_side: 'BACK' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should resolve binary bet, distribute payouts to winners, refund unmatched, and update user win/loss stats', async () => {
        const betData = {
          id: 'bet-res-2',
          status: 'ACTIVE',
          bet_type: 'BINARY',
          total_pool: 200,
          back_pool: 120,
          oppose_pool: 80,
          matched_pool: 160,
          unmatched_pool: 40,
          outcomes: [],
          participants: [
            {
              id: 'p1',
              user_id: 'u-winner',
              side: 'BACK',
              stake: 120,
              matched_stake: 80,
              unmatched_stake: 40,
              user: { id: 'u-winner', balance: 50 },
            },
            {
              id: 'p2',
              user_id: 'u-loser',
              side: 'OPPOSE',
              stake: 80,
              matched_stake: 80,
              unmatched_stake: 0,
              user: { id: 'u-loser', balance: 10 },
            },
          ],
        };

        mockPrismaService.bet.findFirst.mockResolvedValue(betData);
        mockPrismaService.betParticipant.findMany.mockResolvedValue(
          betData.participants,
        );
        mockPrismaService.bet.update.mockResolvedValue({
          ...betData,
          status: 'RESOLVED',
          escrow_status: 'SETTLED',
          winning_side: 'BACK',
          payout_pool: 160,
        });
        mockPrismaService.user.update.mockResolvedValue({});
        mockPrismaService.betParticipant.update.mockResolvedValue({});

        const res = await service.resolveBet('bet-res-2', {
          winning_side: 'BACK',
        });

        expect(res.success).toBe(true);
        expect(res.data.status).toBe('RESOLVED');
        expect(res.data.escrow_status).toBe('SETTLED');
        expect(res.data.winning_side).toBe('BACK');
        expect(res.data.total_payout).toBe('152.00');
        expect(res.data.winners_count).toBe(1);

        // Winner gets net payout 152 (160 gross - 8 platform fee on net profit) + refund of 40 unmatched = 192
        expect(mockPrismaService.user.update).toHaveBeenCalledWith({
          where: { id: 'u-winner' },
          data: {
            balance: { increment: 192 },
            wins: { increment: 1 },
          },
        });

        // Winner participant updated with fee deduction details
        expect(mockPrismaService.betParticipant.update).toHaveBeenCalledWith({
          where: { id: 'p1' },
          data: {
            is_winner: true,
            gross_payout: 160,
            commission_deducted: 8,
            net_payout: 152,
            payout_amount: 152,
            payout_status: 'PAID',
            unmatched_stake: 0,
            refunded_amount: { increment: 40 },
          },
        });

        // Loser user stats incremented
        expect(mockPrismaService.user.update).toHaveBeenCalledWith({
          where: { id: 'u-loser' },
          data: {
            losses: { increment: 1 },
          },
        });
      });
    });

    describe('Slice 10: Platform Commission & Fee Management', () => {
      it('should return bet commission details, pools, and participant deduction roster', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue({
          id: 'bet-comm-1',
          title: 'Arsenal vs Chelsea',
          status: 'RESOLVED',
          commission_rate: 10.0,
          commission_amount: 15.0,
          payout_pool: 135.0,
          matched_pool: 150.0,
          participants: [
            {
              id: 'part-1',
              user_id: 'u-1',
              side: 'BACK',
              matched_stake: 50.0,
              gross_payout: 150.0,
              commission_deducted: 10.0,
              net_payout: 140.0,
              user: {
                id: 'u-1',
                name: 'John Doe',
                username: 'johndoe',
                avatar: null,
              },
            },
          ],
        });

        const res = await service.getBetCommission('bet-comm-1');

        expect(res.success).toBe(true);
        expect(res.data.bet_id).toBe('bet-comm-1');
        expect(res.data.commission_rate).toBe('10.0');
        expect(res.data.total_commission_collected).toBe('15.00');
        expect(res.data.gross_payout_pool).toBe('135.00');
        expect(res.data.participant_fees).toHaveLength(1);
        expect(res.data.participant_fees[0].net_profit).toBe('100.00');
        expect(res.data.participant_fees[0].commission_deducted).toBe('10.00');
      });

      it('should throw NotFoundException if bet not found in getBetCommission', async () => {
        mockPrismaService.bet.findFirst.mockResolvedValue(null);

        await expect(service.getBetCommission('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('Slice 17: Discovery & Feed Filtering Tests', () => {
      it('should filter explore bets by country and is_featured flag', async () => {
        mockPrismaService.bet.findMany.mockResolvedValue([
          {
            id: 'bet-gb-1',
            title: 'Arsenal vs Chelsea',
            description: 'Premier league match',
            category: 'SPORTS',
            creator_id: 'u-1',
            status: 'ACTIVE',
            bet_type: 'BINARY',
            is_private: false,
            invite_code: null,
            deadline: new Date('2026-11-20'),
            total_pool: 12500.0,
            back_pool: 7500.0,
            oppose_pool: 5000.0,
            is_featured: true,
            country: 'GB',
            created_at: new Date(),
            creator: {
              id: 'u-1',
              name: 'Alex',
              username: 'alexm',
              avatar: null,
            },
            outcomes: [],
            _count: { comments: 5 },
          },
        ]);

        const res = await service.exploreBets({
          country: 'GB',
          is_featured: 'true',
          sort: 'trending',
        });

        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(1);
        expect(res.data[0].country).toBe('GB');
        expect(res.data[0].is_featured).toBe(true);
        expect(mockPrismaService.bet.findMany).toHaveBeenCalled();
      });

      it('should return aggregated trending topics with active volume and counts', async () => {
        mockPrismaService.bet.findMany.mockResolvedValue([
          {
            id: 'b1',
            title: 'Arsenal vs Chelsea Derby',
            category: 'SPORTS',
            total_pool: 5000.0,
          },
          {
            id: 'b2',
            title: 'US Presidential Election Outcome',
            category: 'POLITICS',
            total_pool: 12000.0,
          },
          {
            id: 'b3',
            title: 'Bitcoin Halving to $150k',
            category: 'CRYPTO',
            total_pool: 8500.0,
          },
        ]);

        const res = await service.getTrendingTopics();

        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThanOrEqual(3);
        const politicsTopic = res.data.find((t) => t.category === 'POLITICS');
        expect(politicsTopic).toBeDefined();
        expect(politicsTopic?.active_bets_count).toBeGreaterThanOrEqual(1);
        expect(politicsTopic?.total_volume).toBeGreaterThanOrEqual(12000);
      });

      it('should return supported countries with regional bet counts', async () => {
        mockPrismaService.bet.findMany.mockResolvedValue([
          { country: 'US' },
          { country: 'US' },
          { country: 'GB' },
          { country: 'NG' },
        ]);

        const res = await service.getSupportedCountries();

        expect(res.success).toBe(true);
        expect(res.data).toBeInstanceOf(Array);
        const globalEntry = res.data.find((c) => c.code === 'GLOBAL');
        const usEntry = res.data.find((c) => c.code === 'US');
        const gbEntry = res.data.find((c) => c.code === 'GB');

        expect(globalEntry?.count).toBe(4);
        expect(usEntry?.count).toBe(2);
        expect(gbEntry?.count).toBe(1);
      });
    });
  });
});
