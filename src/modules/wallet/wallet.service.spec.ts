import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    betParticipant: {
      findMany: jest.fn(),
    },
    paymentTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getWallet('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate balance, escrow locked, total deposits and withdrawals', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        balance: 250.0,
      });

      mockPrismaService.betParticipant.findMany.mockResolvedValue([
        { stake: 30.0 },
        { stake: 20.0 },
      ]);

      mockPrismaService.paymentTransaction.findMany
        .mockResolvedValueOnce([{ amount: 300.0 }, { amount: 200.0 }]) // deposits
        .mockResolvedValueOnce([{ amount: 150.0 }]); // withdrawals

      const result = await service.getWallet('u1');

      expect(result.success).toBe(true);
      expect(result.data.user_id).toBe('u1');
      expect(result.data.balance).toBe('250.00');
      expect(result.data.escrow_locked).toBe('50.00');
      expect(result.data.total_deposited).toBe('500.00');
      expect(result.data.total_withdrawn).toBe('150.00');
      expect(result.data.currency).toBe('USD');
    });
  });

  describe('getTransactions', () => {
    it('should return formatted transaction ledger', async () => {
      mockPrismaService.paymentTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          user_id: 'u1',
          type: 'DEPOSIT',
          amount: 100.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'Card deposit',
          reference_number: 'DEP-123',
          destination_details: null,
          created_at: new Date('2026-11-11'),
        },
      ]);

      const res = await service.getTransactions('u1');
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('tx-1');
      expect(res.data[0].type).toBe('DEPOSIT');
      expect(res.data[0].amount).toBe('100.00');
    });
  });

  describe('deposit', () => {
    it('should reject non-positive amounts', async () => {
      await expect(
        service.deposit('u1', { amount: 0, payment_method: 'CARD' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.deposit('u1', { amount: 50, payment_method: 'CARD' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should atomically credit user balance and create deposit transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        balance: 100.0,
      });

      const updatedUser = { id: 'u1', balance: 200.0 };
      const transaction = {
        id: 'tx-dep-1',
        created_at: new Date('2026-11-11'),
      };

      mockPrismaService.$transaction.mockResolvedValue([
        updatedUser,
        transaction,
      ]);

      const res = await service.deposit('u1', {
        amount: 100.0,
        payment_method: 'CARD',
      });

      expect(res.success).toBe(true);
      expect(res.data.transaction_id).toBe('tx-dep-1');
      expect(res.data.amount).toBe('100.00');
      expect(res.data.new_balance).toBe('200.00');
      expect(res.data.status).toBe('COMPLETED');
    });
  });

  describe('withdraw', () => {
    it('should reject non-positive amounts', async () => {
      await expect(
        service.withdraw('u1', { amount: -10, payout_method: 'BANK_TRANSFER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject withdrawal when requested amount exceeds balance', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        balance: 50.0,
      });

      await expect(
        service.withdraw('u1', {
          amount: 100.0,
          payout_method: 'BANK_TRANSFER',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should atomically decrement user balance and create pending withdrawal transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        balance: 100.0,
      });

      const updatedUser = { id: 'u1', balance: 60.0 };
      const transaction = {
        id: 'tx-wth-1',
        created_at: new Date('2026-11-11'),
      };

      mockPrismaService.$transaction.mockResolvedValue([
        updatedUser,
        transaction,
      ]);

      const res = await service.withdraw('u1', {
        amount: 40.0,
        payout_method: 'BANK_TRANSFER',
        destination_details: 'IBAN 123',
      });

      expect(res.success).toBe(true);
      expect(res.data.transaction_id).toBe('tx-wth-1');
      expect(res.data.amount).toBe('40.00');
      expect(res.data.new_balance).toBe('60.00');
      expect(res.data.status).toBe('PENDING');
      expect(res.data.destination_details).toBe('IBAN 123');
    });
  });
});
