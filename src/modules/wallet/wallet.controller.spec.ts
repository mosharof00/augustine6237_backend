import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  const mockWalletService = {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    deposit: jest.fn(),
    withdraw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getWallet should delegate to service with current user ID', async () => {
    mockWalletService.getWallet.mockResolvedValue({
      success: true,
      data: { user_id: 'u1', balance: '100.00' },
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.getWallet(req);

    expect(service.getWallet).toHaveBeenCalledWith('u1');
    expect(res.data.balance).toBe('100.00');
  });

  it('getTransactions should delegate to service with filter params', async () => {
    mockWalletService.getTransactions.mockResolvedValue({
      success: true,
      data: [],
    });

    const req = { user: { userId: 'u1' } } as any;
    await controller.getTransactions(req, 'DEPOSIT', 'COMPLETED');

    expect(service.getTransactions).toHaveBeenCalledWith('u1', {
      type: 'DEPOSIT',
      status: 'COMPLETED',
    });
  });

  it('deposit should delegate to service', async () => {
    mockWalletService.deposit.mockResolvedValue({
      success: true,
      data: { amount: '50.00', new_balance: '150.00' },
    });

    const req = { user: { userId: 'u1' } } as any;
    const dto = { amount: 50.0, payment_method: 'CARD' };
    const res = await controller.deposit(req, dto);

    expect(service.deposit).toHaveBeenCalledWith('u1', dto);
    expect(res.data.new_balance).toBe('150.00');
  });

  it('withdraw should delegate to service', async () => {
    mockWalletService.withdraw.mockResolvedValue({
      success: true,
      data: { amount: '30.00', new_balance: '120.00' },
    });

    const req = { user: { userId: 'u1' } } as any;
    const dto = { amount: 30.0, payout_method: 'BANK_TRANSFER' };
    const res = await controller.withdraw(req, dto);

    expect(service.withdraw).toHaveBeenCalledWith('u1', dto);
    expect(res.data.new_balance).toBe('120.00');
  });
});
