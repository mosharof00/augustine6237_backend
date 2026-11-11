import { Test, TestingModule } from '@nestjs/testing';
import { GamingController } from './gaming.controller';
import { GamingService } from './gaming.service';

describe('GamingController', () => {
  let controller: GamingController;

  const mockGamingService = {
    submitScore: jest.fn(),
    getMatchCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamingController],
      providers: [
        {
          provide: GamingService,
          useValue: mockGamingService,
        },
      ],
    }).compile();

    controller = module.get<GamingController>(GamingController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('submitScore should record score and return match envelope', async () => {
    mockGamingService.submitScore.mockResolvedValue({
      bet_id: 'b1',
      status: 'MATCHED',
      is_auto_resolved: true,
      winner_id: 'u1',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.submitScore(req, 'b1', {
      my_score: 3,
      opponent_score: 1,
    });

    expect(res.success).toBe(true);
    expect(res.data.status).toBe('MATCHED');
    expect(res.data.winner_id).toBe('u1');
  });

  it('getMatchCheck should return match state', async () => {
    mockGamingService.getMatchCheck.mockResolvedValue({
      bet_id: 'b1',
      match_status: 'MATCHED',
      submissions: [],
    });

    const res = await controller.getMatchCheck('b1');
    expect(res.success).toBe(true);
    expect(res.data.match_status).toBe('MATCHED');
  });
});
