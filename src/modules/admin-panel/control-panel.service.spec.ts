import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ControlPanelService } from './control-panel.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ControlPanelService', () => {
  let service: ControlPanelService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn().mockResolvedValue(1250),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'u1',
            name: 'Alex Mercer',
            email: 'alex@example.com',
            username: 'alexm',
            type: 'CLIENT',
            status: 1,
            kyc_status: 'VERIFIED',
            balance: 500,
            created_at: new Date(),
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', status: 1 }),
        update: jest.fn().mockResolvedValue({ id: 'u1', status: 0 }),
      },
      bet: {
        count: jest.fn().mockResolvedValue(48),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { matched_pool: 142500, commission_amount: 14250 },
        }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'b1', is_featured: false }),
        update: jest.fn().mockResolvedValue({ id: 'b1', is_featured: true }),
      },
      paymentTransaction: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'tx1',
            user_id: 'u1',
            amount: 100,
            currency: 'USD',
            status: 'PENDING',
            user: { name: 'Alex Mercer' },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'tx1',
          user_id: 'u1',
          amount: 100,
          status: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue({ id: 'tx1', status: 'COMPLETED' }),
      },
      betDispute: {
        count: jest.fn().mockResolvedValue(2),
      },
      $transaction: jest
        .fn()
        .mockImplementation((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlPanelService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ControlPanelService>(ControlPanelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('returns platform-wide macro statistics and metrics', async () => {
      const res = await service.getOverview();
      expect(res.total_users).toBe(1250);
      expect(res.active_bets).toBe(48);
      expect(res.total_volume_traded).toBe(142500);
      expect(res.total_commissions_earned).toBe(14250);
      expect(res.pending_withdrawals_count).toBe(5);
      expect(res.open_disputes_count).toBe(2);
    });
  });

  describe('getUsers', () => {
    it('retrieves user directory with mapped fields', async () => {
      const res = await service.getUsers();
      expect(res.length).toBe(1);
      expect(res[0].name).toBe('Alex Mercer');
      expect(res[0].status).toBe('ACTIVE');
      expect(res[0].wallet_balance).toBe(500);
    });
  });

  describe('updateUserStatus', () => {
    it('throws NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateUserStatus('nonexistent', { status: 'SUSPENDED' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates user status to SUSPENDED', async () => {
      const res = await service.updateUserStatus('u1', { status: 'SUSPENDED' });
      expect(res.user_id).toBe('u1');
      expect(res.status).toBe('SUSPENDED');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { status: 0 },
      });
    });
  });

  describe('featureBet', () => {
    it('updates bet promotional status', async () => {
      const res = await service.featureBet('b1', { is_featured: true });
      expect(res.bet_id).toBe('b1');
      expect(res.is_featured).toBe(true);
    });
  });

  describe('reviewWithdrawal', () => {
    it('approves withdrawal successfully', async () => {
      const res = await service.reviewWithdrawal('tx1', { action: 'APPROVED' });
      expect(res.transaction_id).toBe('tx1');
      expect(res.action).toBe('APPROVED');
      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: { status: 'COMPLETED' },
      });
    });

    it('rejects withdrawal and refunds balance to user', async () => {
      prisma.paymentTransaction.update.mockResolvedValue({
        id: 'tx1',
        status: 'REJECTED',
      });
      const res = await service.reviewWithdrawal('tx1', { action: 'REJECTED' });
      expect(res.transaction_id).toBe('tx1');
      expect(res.action).toBe('REJECTED');
      expect(res.refunded_amount).toBe(100);
    });
  });
});
