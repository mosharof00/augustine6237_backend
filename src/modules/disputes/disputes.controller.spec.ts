import { Test, TestingModule } from '@nestjs/testing';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

describe('DisputesController', () => {
  let controller: DisputesController;

  const mockDisputesService = {
    createDispute: jest.fn(),
    getDisputes: jest.fn(),
    getDisputeById: jest.fn(),
    resolveDispute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        {
          provide: DisputesService,
          useValue: mockDisputesService,
        },
      ],
    }).compile();

    controller = module.get<DisputesController>(DisputesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createDispute should return created dispute with envelope', async () => {
    mockDisputesService.createDispute.mockResolvedValue({
      dispute_id: 'd1',
      status: 'OPEN',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.createDispute(req, {
      bet_id: 'b1',
      reason: 'INCORRECT_RESULT',
      description: 'Mistake in score',
    });

    expect(res.success).toBe(true);
    expect(res.data.dispute_id).toBe('d1');
  });

  it('getDisputes should return disputes list', async () => {
    mockDisputesService.getDisputes.mockResolvedValue([
      { id: 'd1', status: 'OPEN' },
    ]);

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.getDisputes(req, 'b1', 'OPEN');

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it('getDisputeById should return single dispute', async () => {
    mockDisputesService.getDisputeById.mockResolvedValue({ id: 'd1' });

    const res = await controller.getDisputeById('d1');
    expect(res.success).toBe(true);
    expect(res.data.id).toBe('d1');
  });

  it('resolveDispute should adjudicate dispute', async () => {
    mockDisputesService.resolveDispute.mockResolvedValue({
      dispute_id: 'd1',
      status: 'RESOLVED',
      resolution: 'OVERTURN_RESULT',
    });

    const req = { user: { userId: 'admin' } } as any;
    const res = await controller.resolveDispute(req, 'd1', {
      resolution: 'OVERTURN_RESULT',
      resolution_notes: 'Reviewed footage',
    });

    expect(res.success).toBe(true);
    expect(res.data.status).toBe('RESOLVED');
  });
});
