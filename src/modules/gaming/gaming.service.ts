import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitGamingScoreDto } from './dto/submit-gaming-score.dto';

@Injectable()
export class GamingService {
  constructor(private readonly prisma: PrismaService) {}

  async submitScore(userId: string, betId: string, dto: SubmitGamingScoreDto) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: { participants: true },
    });
    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const platform = (dto.platform || 'PLAYSTATION').toUpperCase();

    // Upsert player's submission
    await this.prisma.gamingMatchCheck.upsert({
      where: {
        bet_id_player_id: {
          bet_id: betId,
          player_id: userId,
        },
      },
      update: {
        my_score: dto.my_score,
        opponent_score: dto.opponent_score,
        platform,
        gamertag: dto.gamertag,
        proof_url: dto.proof_url,
      },
      create: {
        bet_id: betId,
        player_id: userId,
        my_score: dto.my_score,
        opponent_score: dto.opponent_score,
        platform,
        gamertag: dto.gamertag,
        proof_url: dto.proof_url,
      },
    });

    const allSubmissions = await this.prisma.gamingMatchCheck.findMany({
      where: { bet_id: betId },
      orderBy: { created_at: 'asc' },
    });

    if (allSubmissions.length < 2) {
      return {
        bet_id: betId,
        status: 'AWAITING_OPPONENT',
        my_score: dto.my_score,
        opponent_score: dto.opponent_score,
      };
    }

    const [p1, p2] = allSubmissions;
    const isMatched =
      p1.my_score === p2.opponent_score && p1.opponent_score === p2.my_score;

    if (isMatched) {
      let winnerId: string | null = null;
      let winningSide: string | null = null;

      if (p1.my_score > p2.my_score) {
        winnerId = p1.player_id;
      } else if (p2.my_score > p1.my_score) {
        winnerId = p2.player_id;
      }

      if (winnerId) {
        const winnerParticipant = bet.participants.find(
          (p) => p.user_id === winnerId,
        );
        winningSide = winnerParticipant?.side || 'BACK';
      }

      await this.prisma.bet.update({
        where: { id: betId },
        data: {
          status: 'RESOLVED',
          escrow_status: 'RESOLVED',
          winning_side: winningSide,
          resolved_at: new Date(),
        },
      });

      return {
        bet_id: betId,
        status: 'MATCHED',
        is_auto_resolved: true,
        winner_id: winnerId,
        scores: {
          player_1_score: p1.my_score,
          player_2_score: p2.my_score,
        },
      };
    } else {
      // Score mismatch: auto-escalate into dispute engine
      let dispute = await this.prisma.betDispute.findFirst({
        where: { bet_id: betId, reason: 'SCORE_MISMATCH', status: 'OPEN' },
      });

      if (!dispute) {
        dispute = await this.prisma.betDispute.create({
          data: {
            bet_id: betId,
            creator_id: userId,
            reason: 'SCORE_MISMATCH',
            description: `Gaming score discrepancy: Player 1 reported ${p1.my_score}-${p1.opponent_score}, while Player 2 reported ${p2.my_score}-${p2.opponent_score}.`,
            evidence_url: dto.proof_url || p1.proof_url || p2.proof_url,
            status: 'OPEN',
          },
        });
      }

      await this.prisma.bet.update({
        where: { id: betId },
        data: { escrow_status: 'DISPUTED' },
      });

      return {
        bet_id: betId,
        status: 'MISMATCH',
        is_auto_disputed: true,
        dispute_id: dispute.id,
        conflict: {
          player_1_claim: `${p1.my_score} - ${p1.opponent_score}`,
          player_2_claim: `${p2.my_score} - ${p2.opponent_score}`,
        },
      };
    }
  }

  async getMatchCheck(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });
    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const submissions = await this.prisma.gamingMatchCheck.findMany({
      where: { bet_id: betId },
      include: {
        player: { select: { id: true, username: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    let matchStatus = 'AWAITING_SUBMISSIONS';
    let disputeId: string | null = null;
    let winnerId: string | null = null;

    if (submissions.length === 1) {
      matchStatus = 'AWAITING_OPPONENT';
    } else if (submissions.length >= 2) {
      const [p1, p2] = submissions;
      const isMatched =
        p1.my_score === p2.opponent_score && p1.opponent_score === p2.my_score;

      if (isMatched) {
        matchStatus = 'MATCHED';
        winnerId =
          p1.my_score > p2.my_score
            ? p1.player_id
            : p2.my_score > p1.my_score
              ? p2.player_id
              : null;
      } else {
        matchStatus = 'MISMATCH';
        const dispute = await this.prisma.betDispute.findFirst({
          where: { bet_id: betId, reason: 'SCORE_MISMATCH' },
        });
        disputeId = dispute?.id || null;
      }
    }

    return {
      bet_id: betId,
      match_status: matchStatus,
      submissions: submissions.map((s) => ({
        player_id: s.player_id,
        gamertag: s.gamertag,
        platform: s.platform,
        my_score: s.my_score,
        opponent_score: s.opponent_score,
        proof_url: s.proof_url,
        submitted_at: s.created_at,
        player_name: (s.player as any)?.name ?? (s.player as any)?.username,
      })),
      dispute_id: disputeId,
      winner_id: winnerId,
    };
  }
}
