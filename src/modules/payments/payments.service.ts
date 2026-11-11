import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmStripePaymentDto } from './dto/confirm-stripe-payment.dto';
import { SubmitWireProofDto } from './dto/submit-wire-proof.dto';
import { CreateCryptoDepositDto } from './dto/create-crypto-deposit.dto';
import { VerifyCryptoDepositDto } from './dto/verify-crypto-deposit.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentMethods() {
    return {
      methods: [
        {
          id: 'stripe_card',
          name: 'Credit / Debit Card',
          provider: 'STRIPE',
          type: 'CARD',
          currencies: ['USD', 'EUR', 'GBP'],
          min_deposit: 5.0,
          max_deposit: 10000.0,
          fee_percent: '0.00',
          processing_time: 'Instant',
          is_enabled: true,
        },
        {
          id: 'bank_wire',
          name: 'Bank Wire Transfer',
          provider: 'BANK',
          type: 'WIRE',
          currencies: ['USD', 'EUR', 'GBP'],
          min_deposit: 50.0,
          max_deposit: 50000.0,
          fee_percent: '0.00',
          processing_time: '1-3 Business Days',
          is_enabled: true,
        },
        {
          id: 'crypto_deposit',
          name: 'Cryptocurrency (USDT / USDC / BTC)',
          provider: 'CRYPTO',
          type: 'CRYPTO',
          currencies: ['USDT', 'USDC', 'BTC', 'ETH'],
          min_deposit: 10.0,
          max_deposit: 100000.0,
          fee_percent: '0.00',
          processing_time: '1-15 Minutes',
          is_enabled: true,
        },
      ],
    };
  }

  async createStripePaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`;
    const currency = (dto.currency || 'USD').toUpperCase();

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        amount: dto.amount,
        currency,
        type: 'DEPOSIT',
        provider: 'STRIPE',
        status: 'PENDING',
        reference_number: paymentIntentId,
        description: 'Stripe Card deposit initialization',
      },
    });

    return {
      payment_intent_id: paymentIntentId,
      client_secret: clientSecret,
      amount: dto.amount.toFixed(2),
      currency,
      transaction_id: tx.id,
    };
  }

  async confirmStripePayment(userId: string, dto: ConfirmStripePaymentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingTx = await this.prisma.paymentTransaction.findFirst({
      where: {
        reference_number: dto.payment_intent_id,
        user_id: userId,
      },
    });

    let tx = existingTx;
    let depositAmount = 100.0;

    if (existingTx) {
      if (existingTx.status === 'COMPLETED') {
        const currentBal = Number(user.balance ?? 0);
        return {
          transaction_id: existingTx.id,
          amount: Number(existingTx.amount ?? 0).toFixed(2),
          new_balance: currentBal.toFixed(2),
          currency: existingTx.currency || 'USD',
          status: 'COMPLETED',
          reference_number: existingTx.reference_number,
        };
      }
      depositAmount = Number(existingTx.amount ?? 100.0);
      tx = await this.prisma.paymentTransaction.update({
        where: { id: existingTx.id },
        data: {
          status: 'COMPLETED',
          description: 'Stripe deposit confirmed and credited',
        },
      });
    } else {
      tx = await this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          amount: depositAmount,
          currency: 'USD',
          type: 'DEPOSIT',
          provider: 'STRIPE',
          status: 'COMPLETED',
          reference_number: dto.payment_intent_id,
          description: 'Stripe deposit confirmed and credited',
        },
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: depositAmount },
      },
    });

    return {
      transaction_id: tx.id,
      amount: depositAmount.toFixed(2),
      new_balance: Number(updatedUser.balance).toFixed(2),
      currency: tx.currency || 'USD',
      status: 'COMPLETED',
      reference_number: dto.payment_intent_id,
    };
  }

  async getBankInstructions() {
    return {
      beneficiary_name: 'BetSocial Global Ltd',
      bank_name: 'JPMorgan Chase Bank, N.A.',
      swift_bic: 'CHASUS33XXX',
      iban: 'GB82WEST12345698765432',
      account_number: '9876543210',
      routing_number: '021000021',
      reference_prefix: 'BS-DEPOSIT-',
      notes:
        'Always include your unique Reference Code in the wire transfer memo so funds are auto-credited.',
    };
  }

  async submitWireProof(userId: string, dto: SubmitWireProofDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currency = (dto.currency || 'USD').toUpperCase();
    const destinationDetails = `${dto.sender_bank}${dto.notes ? ' - ' + dto.notes : ''}`;

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        amount: dto.amount,
        currency,
        type: 'DEPOSIT',
        provider: 'BANK',
        status: 'PENDING',
        reference_number: dto.reference_number,
        destination_details: destinationDetails,
        proof_url: dto.proof_url || null,
        description: 'Bank Wire transfer proof submitted for review',
      },
    });

    return {
      transaction_id: tx.id,
      amount: dto.amount.toFixed(2),
      currency,
      status: 'PENDING',
      reference_number: dto.reference_number,
      created_at: tx.created_at,
    };
  }

  async createCryptoDepositAddress(
    userId: string,
    dto: CreateCryptoDepositDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const crypto = dto.cryptocurrency.toUpperCase();
    const net = dto.network.toUpperCase();

    // Deterministic safe address format for demo and live test simulation
    const userHash = userId
      .replace(/[^a-fA-F0-9]/g, '')
      .padEnd(8, '0')
      .slice(0, 8);
    const depositAddress =
      crypto === 'BTC'
        ? `bc1q${userHash}9xk42w87qnm5782zp`
        : `0x71C${userHash}e275d31b816280b2aB38`;

    return {
      cryptocurrency: crypto,
      network: net,
      deposit_address: depositAddress,
      memo_or_tag: crypto === 'XRP' || crypto === 'TON' ? '12345678' : null,
      min_deposit: '10.00',
      estimated_confirmations: net === 'POLYGON' ? 64 : 12,
    };
  }

  async verifyCryptoDeposit(userId: string, dto: VerifyCryptoDepositDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingTx = await this.prisma.paymentTransaction.findFirst({
      where: { reference_number: dto.tx_hash },
    });
    if (existingTx) {
      throw new BadRequestException('Transaction hash already processed');
    }

    const crypto = dto.cryptocurrency.toUpperCase();
    const net = dto.network.toUpperCase();

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        amount: dto.amount,
        currency: 'USD',
        type: 'DEPOSIT',
        provider: 'CRYPTO',
        status: 'COMPLETED',
        reference_number: dto.tx_hash,
        network: net,
        description: `Crypto deposit via ${crypto} (${net})`,
      },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: dto.amount },
      },
    });

    return {
      transaction_id: tx.id,
      amount: dto.amount.toFixed(2),
      new_balance: Number(updatedUser.balance).toFixed(2),
      currency: 'USD',
      status: 'COMPLETED',
      reference_number: dto.tx_hash,
    };
  }
}
