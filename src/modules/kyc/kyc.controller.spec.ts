import { Test, TestingModule } from '@nestjs/testing';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

describe('KycController', () => {
  let controller: KycController;

  const mockKycService = {
    getKycStatus: jest.fn(),
    submitKyc: jest.fn(),
    reviewKyc: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycController],
      providers: [
        {
          provide: KycService,
          useValue: mockKycService,
        },
      ],
    }).compile();

    controller = module.get<KycController>(KycController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getKycStatus should return status envelope', async () => {
    mockKycService.getKycStatus.mockResolvedValue({
      user_id: 'u1',
      kyc_status: 'VERIFIED',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.getKycStatus(req);
    expect(res.success).toBe(true);
    expect(res.data.kyc_status).toBe('VERIFIED');
  });

  it('submitKyc should queue document for review', async () => {
    mockKycService.submitKyc.mockResolvedValue({
      kyc_status: 'PENDING',
      document_type: 'PASSPORT',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.submitKyc(req, {
      document_type: 'PASSPORT',
      document_number: 'P123',
      document_url: 'https://doc.jpg',
    });

    expect(res.success).toBe(true);
    expect(res.data.kyc_status).toBe('PENDING');
  });

  it('reviewKyc should approve or reject KYC', async () => {
    mockKycService.reviewKyc.mockResolvedValue({
      user_id: 'u1',
      kyc_status: 'VERIFIED',
    });

    const req = { user: { userId: 'admin' } } as any;
    const res = await controller.reviewKyc(req, {
      user_id: 'u1',
      status: 'VERIFIED',
    });

    expect(res.success).toBe(true);
    expect(res.data.kyc_status).toBe('VERIFIED');
  });
});
