import { Test, TestingModule } from '@nestjs/testing';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

describe('FeesController', () => {
  let controller: FeesController;
  let service: FeesService;

  const mockFeesService = {
    getFeeConfig: jest.fn(),
    updateFeeConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeesController],
      providers: [
        {
          provide: FeesService,
          useValue: mockFeesService,
        },
      ],
    }).compile();

    controller = module.get<FeesController>(FeesController);
    service = module.get<FeesService>(FeesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getFeeConfig should delegate to service', async () => {
    mockFeesService.getFeeConfig.mockResolvedValue({
      success: true,
      data: { commission_rate: '10' },
    });

    const result = await controller.getFeeConfig();
    expect(service.getFeeConfig).toHaveBeenCalled();
    expect(result.data.commission_rate).toBe('10');
  });

  it('updateFeeConfig should delegate to service with current user id', async () => {
    mockFeesService.updateFeeConfig.mockResolvedValue({
      success: true,
      data: { commission_rate: '8.5' },
    });

    const req = { user: { userId: 'admin-123' } } as any;
    const dto = { commission_rate: 8.5, description: 'Promotional fee' };

    const result = await controller.updateFeeConfig(req, dto);
    expect(service.updateFeeConfig).toHaveBeenCalledWith(dto, 'admin-123');
    expect(result.data.commission_rate).toBe('8.5');
  });
});
