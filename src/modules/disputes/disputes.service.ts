import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async createDispute(userId: string, dto: CreateDisputeDto) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: dto.bet_id },
    });
    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const existingOpen = await this.prisma.betDispute.findFirst({
      where: {
        bet_id: dto.bet_id,
        creator_id: userId,
        status: 'OPEN',
      },
    });
    if (existingOpen) {
      throw new BadRequestException(
        'You already have an active dispute on this bet',
      );
    }

    const dispute = await this.prisma.betDispute.create({
      data: {
        bet_id: dto.bet_id,
        creator_id: userId,
        reason: dto.reason.toUpperCase(),
        description: dto.description,
        evidence_url: dto.evidence_url || null,
        status: 'OPEN',
      },
      include: {
        bet: { select: { id: true, title: true } },
        creator: { select: { id: true, username: true, name: true } },
      },
    });

    // Freeze escrow status while under active dispute
    await this.prisma.bet.update({
      where: { id: dto.bet_id },
      data: { escrow_status: 'DISPUTED' },
    });

    return {
      dispute_id: dispute.id,
      bet_id: dispute.bet_id,
      reason: dispute.reason,
      status: dispute.status,
      evidence_url: dispute.evidence_url,
      created_at: dispute.created_at,
    };
  }

  async getDisputes(filters?: {
    bet_id?: string;
    status?: string;
    creator_id?: string;
  }) {
    const where: any = {};
    if (filters?.bet_id) where.bet_id = filters.bet_id;
    if (filters?.status) where.status = filters.status.toUpperCase();
    if (filters?.creator_id) where.creator_id = filters.creator_id;

    return this.prisma.betDispute.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        bet: { select: { id: true, title: true } },
        creator: { select: { id: true, username: true, name: true } },
      },
    });
  }

  async getDisputeById(id: string) {
    const dispute = await this.prisma.betDispute.findUnique({
      where: { id },
      include: {
        bet: { select: { id: true, title: true } },
        creator: { select: { id: true, username: true, name: true } },
      },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async resolveDispute(resolverId: string, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.betDispute.findUnique({
      where: { id },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const resolvedAt = new Date();

    const updatedDispute = await this.prisma.betDispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution: dto.resolution,
        resolution_notes: dto.resolution_notes,
        resolver_id: resolverId,
        resolved_at: resolvedAt,
      },
    });

    // Update bet status & escrow according to adjudication
    if (dto.resolution === 'REFUND_ALL') {
      await this.prisma.bet.update({
        where: { id: dispute.bet_id },
        data: {
          status: 'CANCELLED',
          escrow_status: 'REFUNDED',
        },
      });
    } else if (dto.resolution === 'OVERTURN_RESULT') {
      await this.prisma.bet.update({
        where: { id: dispute.bet_id },
        data: {
          winning_side: dto.new_winning_side || null,
          winning_outcome_id: dto.new_winning_outcome_id || null,
          escrow_status: 'RESOLVED',
        },
      });
    } else if (dto.resolution === 'UPHOLD_ORIGINAL') {
      await this.prisma.bet.update({
        where: { id: dispute.bet_id },
        data: {
          escrow_status: 'RELEASED',
        },
      });
    }

    return {
      dispute_id: updatedDispute.id,
      bet_id: updatedDispute.bet_id,
      status: 'RESOLVED',
      resolution: updatedDispute.resolution,
      resolution_notes: updatedDispute.resolution_notes,
      resolved_at: updatedDispute.resolved_at,
    };
  }
}
