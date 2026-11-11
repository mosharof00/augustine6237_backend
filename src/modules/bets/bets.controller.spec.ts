import { Test, TestingModule } from '@nestjs/testing';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';

describe('BetsController', () => {
  let controller: BetsController;

  const mockBetsService = {
    getPublicBets: jest.fn(),
    getBetById: jest.fn(),
    createBet: jest.fn(),
    getBetComments: jest.fn(),
    createBetComment: jest.fn(),
    deleteBetComment: jest.fn(),
    getBetByInviteCode: jest.fn(),
    joinBetByInviteCode: jest.fn(),
    getBetParticipants: jest.fn(),
    getBetOutcomes: jest.fn(),
    placeStake: jest.fn(),
    getMatchedStatus: jest.fn(),
    refundUnmatchedStakes: jest.fn(),
    getEscrowStatus: jest.fn(),
    resolveBet: jest.fn(),
    getBetCommission: jest.fn(),
    exploreBets: jest.fn(),
    getTrendingTopics: jest.fn(),
    getSupportedCountries: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BetsController],
      providers: [
        {
          provide: BetsService,
          useValue: mockBetsService,
        },
      ],
    }).compile();

    controller = module.get<BetsController>(BetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getPublicBets', async () => {
    mockBetsService.getPublicBets.mockResolvedValue({
      success: true,
      data: [],
    });
    const query = { category: 'SPORTS', sort: 'trending' };

    const res = await controller.getPublicBets(query);
    expect(res.success).toBe(true);
    expect(mockBetsService.getPublicBets).toHaveBeenCalledWith(query);
  });

  it('should call getBetById', async () => {
    mockBetsService.getBetById.mockResolvedValue({
      success: true,
      data: { id: 'bet-1' },
    });

    const res = await controller.getBetById('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetById).toHaveBeenCalledWith('bet-1');
  });

  it('should call createBet', async () => {
    mockBetsService.createBet.mockResolvedValue({
      success: true,
      data: { id: 'bet-1' },
    });
    const req = { user: { userId: 'u1' } } as any;
    const dto = {
      title: 'Arsenal to beat Chelsea',
      category: 'SPORTS',
      deadline: '2026-11-12T19:00:00Z',
    };

    const res = await controller.createBet(req, dto as any);
    expect(res.success).toBe(true);
    expect(mockBetsService.createBet).toHaveBeenCalledWith('u1', dto);
  });

  it('should call getBetComments', async () => {
    mockBetsService.getBetComments.mockResolvedValue({
      success: true,
      data: [],
    });
    const res = await controller.getBetComments('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetComments).toHaveBeenCalledWith('bet-1');
  });

  it('should call createBetComment', async () => {
    mockBetsService.createBetComment.mockResolvedValue({
      success: true,
      data: { id: 'c1' },
    });
    const req = { user: { userId: 'u1' } } as any;
    const dto = { content: 'My analysis', stance: 'BACK' };

    const res = await controller.createBetComment('bet-1', req, dto);
    expect(res.success).toBe(true);
    expect(mockBetsService.createBetComment).toHaveBeenCalledWith(
      'bet-1',
      'u1',
      dto,
    );
  });

  it('should call deleteBetComment', async () => {
    mockBetsService.deleteBetComment.mockResolvedValue({ success: true });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.deleteBetComment('bet-1', 'c1', req);
    expect(res.success).toBe(true);
    expect(mockBetsService.deleteBetComment).toHaveBeenCalledWith(
      'bet-1',
      'c1',
      'u1',
    );
  });

  it('should call getBetByInviteCode', async () => {
    mockBetsService.getBetByInviteCode.mockResolvedValue({
      success: true,
      data: { id: 'bet-priv-1', invite_code: 'BET-9K2L8X' },
    });

    const res = await controller.getBetByInviteCode('BET-9K2L8X');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetByInviteCode).toHaveBeenCalledWith(
      'BET-9K2L8X',
    );
  });

  it('should call joinBetByInviteCode', async () => {
    mockBetsService.joinBetByInviteCode.mockResolvedValue({
      success: true,
      data: { bet: { id: 'bet-1' } },
    });
    const req = { user: { userId: 'u2' } } as any;
    const dto = { side: 'OPPOSE', stake: 50 };

    const res = await controller.joinBetByInviteCode(
      'BET-9K2L8X',
      req,
      dto as any,
    );
    expect(res.success).toBe(true);
    expect(mockBetsService.joinBetByInviteCode).toHaveBeenCalledWith(
      'BET-9K2L8X',
      'u2',
      dto,
    );
  });

  it('should call getBetParticipants', async () => {
    mockBetsService.getBetParticipants.mockResolvedValue({
      success: true,
      data: [],
    });

    const res = await controller.getBetParticipants('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetParticipants).toHaveBeenCalledWith('bet-1');
  });

  it('should call getBetOutcomes', async () => {
    mockBetsService.getBetOutcomes.mockResolvedValue({
      success: true,
      data: [
        { id: 'out-1', title: 'Arsenal', percent: 60 },
        { id: 'out-2', title: 'Man City', percent: 40 },
      ],
    });

    const res = await controller.getBetOutcomes('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetOutcomes).toHaveBeenCalledWith('bet-1');
  });

  it('should call placeStake', async () => {
    mockBetsService.placeStake.mockResolvedValue({
      success: true,
      data: { bet: { id: 'bet-1' }, participant: { id: 'part-1' } },
    });
    const req = { user: { userId: 'u2' } } as any;
    const dto = { outcome_id: 'out-1', stake: 100 };

    const res = await controller.placeStake('bet-1', req, dto as any);
    expect(res.success).toBe(true);
    expect(mockBetsService.placeStake).toHaveBeenCalledWith('bet-1', 'u2', dto);
  });

  it('should call getMatchedStatus', async () => {
    mockBetsService.getMatchedStatus.mockResolvedValue({
      success: true,
      data: {
        bet_id: 'bet-1',
        matched_pool: '100.00',
        unmatched_pool: '50.00',
      },
    });

    const res = await controller.getMatchedStatus('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getMatchedStatus).toHaveBeenCalledWith('bet-1');
  });

  it('should call refundUnmatchedStakes', async () => {
    mockBetsService.refundUnmatchedStakes.mockResolvedValue({
      success: true,
      data: { bet_id: 'bet-1', refunded_count: 1, total_refunded: '50.00' },
    });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.refundUnmatchedStakes('bet-1', req);
    expect(res.success).toBe(true);
    expect(mockBetsService.refundUnmatchedStakes).toHaveBeenCalledWith(
      'bet-1',
      'u1',
    );
  });

  it('should call getEscrowStatus', async () => {
    mockBetsService.getEscrowStatus.mockResolvedValue({
      success: true,
      data: {
        bet_id: 'bet-1',
        total_escrow: '200.00',
        matched_pool: '160.00',
        escrow_status: 'LOCKED',
      },
    });

    const res = await controller.getEscrowStatus('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getEscrowStatus).toHaveBeenCalledWith('bet-1');
  });

  it('should call resolveBet', async () => {
    mockBetsService.resolveBet.mockResolvedValue({
      success: true,
      data: {
        bet_id: 'bet-1',
        status: 'RESOLVED',
        escrow_status: 'SETTLED',
        winning_side: 'BACK',
      },
    });
    const req = { user: { userId: 'u-admin' } } as any;
    const dto = { winning_side: 'BACK' as const };

    const res = await controller.resolveBet('bet-1', req, dto);
    expect(res.success).toBe(true);
    expect(mockBetsService.resolveBet).toHaveBeenCalledWith(
      'bet-1',
      dto,
      'u-admin',
    );
  });

  it('should call getBetCommission', async () => {
    mockBetsService.getBetCommission.mockResolvedValue({
      success: true,
      data: {
        bet_id: 'bet-1',
        commission_rate: '10.0',
        total_commission_collected: '15.00',
      },
    });

    const res = await controller.getBetCommission('bet-1');
    expect(res.success).toBe(true);
    expect(mockBetsService.getBetCommission).toHaveBeenCalledWith('bet-1');
  });

  it('should call exploreBets with country and featured filters', async () => {
    mockBetsService.exploreBets.mockResolvedValue({
      success: true,
      data: [{ id: 'bet-exp-1', country: 'GB', is_featured: true }],
    });

    const query = { country: 'GB', is_featured: 'true', sort: 'trending' };
    const res = await controller.exploreBets(query);

    expect(res.success).toBe(true);
    expect(mockBetsService.exploreBets).toHaveBeenCalledWith(query);
  });

  it('should call getTrendingTopics', async () => {
    mockBetsService.getTrendingTopics.mockResolvedValue({
      success: true,
      data: [{ tag: 'Premier League', active_bets_count: 18 }],
    });

    const res = await controller.getTrendingTopics();
    expect(res.success).toBe(true);
    expect(mockBetsService.getTrendingTopics).toHaveBeenCalled();
  });

  it('should call getSupportedCountries', async () => {
    mockBetsService.getSupportedCountries.mockResolvedValue({
      success: true,
      data: [{ code: 'GLOBAL', count: 48 }],
    });

    const res = await controller.getSupportedCountries();
    expect(res.success).toBe(true);
    expect(mockBetsService.getSupportedCountries).toHaveBeenCalled();
  });
});
