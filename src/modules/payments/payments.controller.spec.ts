import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPaymentsService = {
    getPaymentMethods: jest.fn(),
    createStripePaymentIntent: jest.fn(),
    confirmStripePayment: jest.fn(),
    getBankInstructions: jest.fn(),
    submitWireProof: jest.fn(),
    createCryptoDepositAddress: jest.fn(),
    verifyCryptoDeposit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getPaymentMethods should return methods list wrapped in envelope', async () => {
    mockPaymentsService.getPaymentMethods.mockResolvedValue({ methods: [] });

    const res = await controller.getPaymentMethods();
    expect(res.success).toBe(true);
    expect(res.data.methods).toEqual([]);
  });

  it('createStripePaymentIntent should return client secret and payment intent id', async () => {
    mockPaymentsService.createStripePaymentIntent.mockResolvedValue({
      payment_intent_id: 'pi_1',
      client_secret: 'pi_1_secret',
      amount: '100.00',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.createStripePaymentIntent(req, {
      amount: 100,
    });

    expect(res.success).toBe(true);
    expect(res.data.payment_intent_id).toBe('pi_1');
  });

  it('confirmStripePayment should confirm deposit and return updated balance', async () => {
    mockPaymentsService.confirmStripePayment.mockResolvedValue({
      transaction_id: 'tx_1',
      amount: '100.00',
      new_balance: '350.00',
      status: 'COMPLETED',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.confirmStripePayment(req, {
      payment_intent_id: 'pi_1',
    });

    expect(res.success).toBe(true);
    expect(res.data.status).toBe('COMPLETED');
    expect(res.data.new_balance).toBe('350.00');
  });

  it('getBankInstructions should return instructions', async () => {
    mockPaymentsService.getBankInstructions.mockResolvedValue({
      beneficiary_name: 'BetSocial Global Ltd',
      iban: 'GB123',
    });

    const res = await controller.getBankInstructions();
    expect(res.success).toBe(true);
    expect(res.data.beneficiary_name).toBe('BetSocial Global Ltd');
  });

  it('submitWireProof should return pending transaction', async () => {
    mockPaymentsService.submitWireProof.mockResolvedValue({
      transaction_id: 'tx_b1',
      status: 'PENDING',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.submitWireProof(req, {
      amount: 500,
      sender_bank: 'Chase',
      reference_number: 'REF-1',
    });

    expect(res.success).toBe(true);
    expect(res.data.status).toBe('PENDING');
  });

  it('createCryptoDepositAddress should return address and network', async () => {
    mockPaymentsService.createCryptoDepositAddress.mockResolvedValue({
      cryptocurrency: 'USDT',
      network: 'POLYGON',
      deposit_address: '0x123',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.createCryptoDepositAddress(req, {
      cryptocurrency: 'USDT',
      network: 'POLYGON',
    });

    expect(res.success).toBe(true);
    expect(res.data.deposit_address).toBe('0x123');
  });

  it('verifyCryptoDeposit should credit wallet and return completed transaction', async () => {
    mockPaymentsService.verifyCryptoDeposit.mockResolvedValue({
      transaction_id: 'tx_c1',
      amount: '200.00',
      new_balance: '550.00',
      status: 'COMPLETED',
    });

    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.verifyCryptoDeposit(req, {
      tx_hash: '0xabc',
      cryptocurrency: 'USDT',
      network: 'POLYGON',
      amount: 200,
    });

    expect(res.success).toBe(true);
    expect(res.data.status).toBe('COMPLETED');
    expect(res.data.new_balance).toBe('550.00');
  });
});
