import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FeatureBetDto } from './dto/feature-bet.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';

@Injectable()
export class ControlPanelService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const totalUsers = await this.prisma.user.count();
    const activeBets = await this.prisma.bet.count({
      where: { status: 'ACTIVE' },
    });

    const betsAgg = await this.prisma.bet.aggregate({
      _sum: {
        matched_pool: true,
        commission_amount: true,
      },
    });

    const escrowAgg = await this.prisma.bet.aggregate({
      where: { escrow_status: 'LOCKED' },
      _sum: {
        matched_pool: true,
      },
    });

    const pendingWithdrawalsCount = await this.prisma.paymentTransaction.count({
      where: {
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
    });

    const openDisputesCount = await this.prisma.betDispute.count({
      where: { status: 'OPEN' },
    });

    const unverifiedKycCount = await this.prisma.user.count({
      where: {
        kyc_status: { in: ['UNVERIFIED', 'PENDING'] },
      },
    });

    return {
      total_users: totalUsers,
      active_bets: activeBets,
      total_escrow_locked: Number(escrowAgg._sum.matched_pool) || 0,
      total_volume_traded: Number(betsAgg._sum.matched_pool) || 0,
      total_commissions_earned: Number(betsAgg._sum.commission_amount) || 0,
      pending_withdrawals_count: pendingWithdrawalsCount,
      open_disputes_count: openDisputesCount,
      unverified_kyc_count: unverifiedKycCount,
    };
  }

  async getUsers(query?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status === 'ACTIVE') where.status = 1;
    if (query?.status === 'SUSPENDED') where.status = 0;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        type: true,
        status: true,
        kyc_status: true,
        balance: true,
        created_at: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name || `${u.username || 'User'}`,
      email: u.email,
      username: u.username,
      role: u.type || 'CLIENT',
      status: u.status === 1 ? 'ACTIVE' : 'SUSPENDED',
      kyc_status: u.kyc_status || 'UNVERIFIED',
      wallet_balance: Number(u.balance) || 0,
      created_at: u.created_at,
    }));
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const statusInt = dto.status === 'ACTIVE' ? 1 : 0;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: statusInt },
    });

    return {
      user_id: updated.id,
      status: dto.status,
      updated_at: new Date().toISOString(),
    };
  }

  async featureBet(betId: string, dto: FeatureBetDto) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID ${betId} not found`);
    }

    const updated = await this.prisma.bet.update({
      where: { id: betId },
      data: { is_featured: dto.is_featured },
    });

    return {
      bet_id: updated.id,
      is_featured: updated.is_featured,
    };
  }

  async getPendingWithdrawals() {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      user_id: tx.user_id,
      user_name: tx.user?.name || tx.user?.username || 'User',
      amount: Number(tx.amount) || 0,
      currency: tx.currency || 'USD',
      status: tx.status || 'PENDING',
      payment_method: tx.withdraw_via || tx.provider || 'BANK_TRANSFER',
      destination: tx.destination_details || tx.reference_number || 'N/A',
      created_at: tx.created_at,
    }));
  }

  async reviewWithdrawal(txId: string, dto: ReviewWithdrawalDto) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id: txId },
    });

    if (!tx) {
      throw new NotFoundException(
        `Withdrawal transaction with ID ${txId} not found`,
      );
    }

    if (dto.action === 'APPROVED') {
      const updated = await this.prisma.paymentTransaction.update({
        where: { id: txId },
        data: {
          status: 'COMPLETED',
        },
      });

      return {
        transaction_id: updated.id,
        status: updated.status,
        action: 'APPROVED',
        processed_at: new Date().toISOString(),
      };
    } else {
      // REJECTED - Refund amount back to user's wallet balance
      const [updated] = await this.prisma.$transaction([
        this.prisma.paymentTransaction.update({
          where: { id: txId },
          data: {
            status: 'REJECTED',
          },
        }),
        this.prisma.user.update({
          where: { id: tx.user_id },
          data: {
            balance: {
              increment: tx.amount,
            },
          },
        }),
      ]);

      return {
        transaction_id: updated.id,
        status: updated.status,
        action: 'REJECTED',
        refunded_amount: Number(tx.amount),
        processed_at: new Date().toISOString(),
      };
    }
  }
}
