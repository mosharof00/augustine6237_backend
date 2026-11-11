import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPaymentMethods', () => {
    it('should return available deposit and withdrawal methods', async () => {
      const res = await service.getPaymentMethods();
      expect(res.methods).toHaveLength(3);
      expect(res.methods[0].provider).toBe('STRIPE');
      expect(res.methods[1].provider).toBe('BANK');
      expect(res.methods[2].provider).toBe('CRYPTO');
    });
  });

  describe('createStripePaymentIntent', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createStripePaymentIntent('u_none', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create pending Stripe transaction and return intent info', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx_strp_1',
      });

      const res = await service.createStripePaymentIntent('u1', {
        amount: 100,
        currency: 'USD',
      });

      expect(res.transaction_id).toBe('tx_strp_1');
      expect(res.amount).toBe('100.00');
      expect(res.currency).toBe('USD');
      expect(res.payment_intent_id).toContain('pi_');
      expect(res.client_secret).toContain('_secret_');
    });
  });

  describe('confirmStripePayment', () => {
    it('should credit user balance and update transaction to COMPLETED', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        balance: 50.0,
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx_strp_1',
        amount: 100.0,
        currency: 'USD',
        status: 'PENDING',
        reference_number: 'pi_test_123',
      });
      mockPrismaService.paymentTransaction.update.mockResolvedValue({
        id: 'tx_strp_1',
        status: 'COMPLETED',
        currency: 'USD',
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        balance: 150.0,
      });

      const res = await service.confirmStripePayment('u1', {
        payment_intent_id: 'pi_test_123',
      });

      expect(res.transaction_id).toBe('tx_strp_1');
      expect(res.amount).toBe('100.00');
      expect(res.new_balance).toBe('150.00');
      expect(res.status).toBe('COMPLETED');
    });
  });

  describe('getBankInstructions', () => {
    it('should return beneficiary bank wire transfer details', async () => {
      const res = await service.getBankInstructions();
      expect(res.beneficiary_name).toBe('BetSocial Global Ltd');
      expect(res.iban).toBeDefined();
      expect(res.swift_bic).toBe('CHASUS33XXX');
    });
  });

  describe('submitWireProof', () => {
    it('should record pending bank wire transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx_bank_1',
        created_at: new Date('2026-11-11'),
      });

      const res = await service.submitWireProof('u1', {
        amount: 500,
        sender_bank: 'Wells Fargo',
        reference_number: 'BS-DEPOSIT-98213',
      });

      expect(res.transaction_id).toBe('tx_bank_1');
      expect(res.amount).toBe('500.00');
      expect(res.status).toBe('PENDING');
      expect(res.reference_number).toBe('BS-DEPOSIT-98213');
    });
  });

  describe('createCryptoDepositAddress', () => {
    it('should generate deposit address and network parameters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });

      const res = await service.createCryptoDepositAddress('u1', {
        cryptocurrency: 'USDT',
        network: 'POLYGON',
      });

      expect(res.cryptocurrency).toBe('USDT');
      expect(res.network).toBe('POLYGON');
      expect(res.deposit_address).toBeDefined();
      expect(res.min_deposit).toBe('10.00');
    });
  });

  describe('verifyCryptoDeposit', () => {
    it('should reject already processed tx_hash', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx_old',
      });

      await expect(
        service.verifyCryptoDeposit('u1', {
          tx_hash: '0xabc',
          cryptocurrency: 'USDT',
          network: 'POLYGON',
          amount: 200,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should credit wallet on valid crypto deposit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue(null);
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx_cryp_1',
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        balance: 350.0,
      });

      const res = await service.verifyCryptoDeposit('u1', {
        tx_hash: '0xunique123',
        cryptocurrency: 'USDT',
        network: 'POLYGON',
        amount: 200,
      });

      expect(res.transaction_id).toBe('tx_cryp_1');
      expect(res.amount).toBe('200.00');
      expect(res.new_balance).toBe('350.00');
      expect(res.status).toBe('COMPLETED');
      expect(res.reference_number).toBe('0xunique123');
    });
  });
});
