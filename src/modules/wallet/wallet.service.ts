import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepositWalletDto } from './dto/deposit-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balance = user.balance ? Number(user.balance) : 0;

    // Calculate escrow locked stake across active bets
    const activeParticipants = await this.prisma.betParticipant.findMany({
      where: {
        user_id: userId,
        payout_status: 'PENDING',
        bet: { status: 'ACTIVE' },
      },
    });

    const escrowLocked = activeParticipants.reduce(
      (sum, p) => sum + Number(p.stake || 0),
      0,
    );

    // Sum completed deposits
    const completedDeposits = await this.prisma.paymentTransaction.findMany({
      where: {
        user_id: userId,
        type: { in: ['DEPOSIT', 'deposit'] },
        status: { in: ['COMPLETED', 'completed', 'paid'] },
      },
    });

    const totalDeposited = completedDeposits.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    // Sum withdrawals
    const withdrawals = await this.prisma.paymentTransaction.findMany({
      where: {
        user_id: userId,
        type: { in: ['WITHDRAWAL', 'withdraw', 'withdrawal'] },
        status: { in: ['COMPLETED', 'PENDING', 'completed', 'pending'] },
      },
    });

    const totalWithdrawn = withdrawals.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    return {
      success: true,
      data: {
        user_id: user.id,
        balance: balance.toFixed(2),
        escrow_locked: escrowLocked.toFixed(2),
        total_deposited: totalDeposited.toFixed(2),
        total_withdrawn: totalWithdrawn.toFixed(2),
        currency: 'USD',
      },
    };
  }

  async getTransactions(
    userId: string,
    query?: { type?: string; status?: string },
  ) {
    const where: any = { user_id: userId };

    if (query?.type) {
      where.type = {
        in: [query.type.toUpperCase(), query.type.toLowerCase()],
      };
    }

    if (query?.status) {
      where.status = {
        in: [query.status.toUpperCase(), query.status.toLowerCase()],
      };
    }

    const txs = await this.prisma.paymentTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const formatted = txs.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      type: (t.type || 'DEPOSIT').toUpperCase(),
      amount: Number(t.amount || 0).toFixed(2),
      currency: t.currency || 'USD',
      status: (t.status || 'COMPLETED').toUpperCase(),
      description:
        t.description ||
        `${t.type || 'Transaction'} via ${t.provider || 'Platform'}`,
      reference_id: t.reference_number || t.id,
      destination_details: t.destination_details,
      created_at: t.created_at,
    }));

    return {
      success: true,
      data: formatted,
    };
  }

  async deposit(userId: string, dto: DepositWalletDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const refNumber = `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const [updatedUser, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: dto.amount },
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          type: 'DEPOSIT',
          amount: dto.amount,
          currency: 'USD',
          status: 'COMPLETED',
          provider: dto.payment_method ?? 'CARD',
          description: dto.description ?? 'Wallet deposit',
          reference_number: refNumber,
        },
      }),
    ]);

    const newBalance = updatedUser.balance ? Number(updatedUser.balance) : 0;

    return {
      success: true,
      message: 'Deposit processed successfully and wallet balance credited',
      data: {
        transaction_id: transaction.id,
        amount: dto.amount.toFixed(2),
        new_balance: newBalance.toFixed(2),
        currency: 'USD',
        status: 'COMPLETED',
        created_at: transaction.created_at,
      },
    };
  }

  async withdraw(userId: string, dto: WithdrawWalletDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than zero',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentBalance = user.balance ? Number(user.balance) : 0;
    if (currentBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance for withdrawal. Available: $${currentBalance.toFixed(2)}, Requested: $${dto.amount.toFixed(2)}`,
      );
    }

    const refNumber = `WTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const [updatedUser, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: dto.amount },
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          type: 'WITHDRAWAL',
          amount: dto.amount,
          currency: 'USD',
          status: 'PENDING',
          provider: dto.payout_method ?? 'BANK_TRANSFER',
          destination_details: dto.destination_details,
          description: `Withdrawal via ${dto.payout_method ?? 'BANK_TRANSFER'}`,
          reference_number: refNumber,
        },
      }),
    ]);

    const newBalance = updatedUser.balance ? Number(updatedUser.balance) : 0;

    return {
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction_id: transaction.id,
        amount: dto.amount.toFixed(2),
        new_balance: newBalance.toFixed(2),
        currency: 'USD',
        status: 'PENDING',
        destination_details: dto.destination_details,
        created_at: transaction.created_at,
      },
    };
  }
}
