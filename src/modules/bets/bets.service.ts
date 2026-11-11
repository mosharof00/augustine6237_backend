import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBetCommentDto } from './dto/create-bet-comment.dto';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetsDto } from './dto/query-bets.dto';
import { JoinBetDto } from './dto/join-bet.dto';
import { PlaceStakeDto } from './dto/place-stake.dto';
import { ResolveBetDto } from './dto/resolve-bet.dto';

@Injectable()
export class BetsService {
  constructor(private prisma: PrismaService) {}

  private formatOutcomes(bet: any) {
    const total = Number(bet.total_pool) || 0;
    if (bet.outcomes && bet.outcomes.length > 0) {
      return bet.outcomes.map((o: any) => {
        const pool = Number(o.pool) || 0;
        const percent =
          total > 0
            ? Number(((pool / total) * 100).toFixed(1))
            : Number((100 / bet.outcomes.length).toFixed(1));
        return {
          id: o.id,
          bet_id: o.bet_id,
          title: o.title,
          pool: o.pool.toString(),
          percent,
          is_winner: o.is_winner,
        };
      });
    }

    const back = Number(bet.back_pool) || 0;
    const oppose = Number(bet.oppose_pool) || 0;
    const backPercent =
      total > 0 ? Number(((back / total) * 100).toFixed(1)) : 50.0;
    const opposePercent =
      total > 0 ? Number(((oppose / total) * 100).toFixed(1)) : 50.0;

    return [
      {
        id: 'back',
        bet_id: bet.id,
        title: 'BACK (Yes)',
        pool: (bet.back_pool ?? 0).toString(),
        percent: backPercent,
        is_winner: null,
      },
      {
        id: 'oppose',
        bet_id: bet.id,
        title: 'OPPOSE (No)',
        pool: (bet.oppose_pool ?? 0).toString(),
        percent: opposePercent,
        is_winner: null,
      },
    ];
  }

  async getPublicBets(query: QueryBetsDto) {
    const where: any = {
      is_private: false,
    };

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    } else if (!query.status) {
      where.status = 'ACTIVE';
    }

    if (
      query.country &&
      query.country !== 'GLOBAL' &&
      query.country !== 'ALL'
    ) {
      where.country = query.country;
    }

    if (query.is_featured !== undefined) {
      const isFeatured = String(query.is_featured) === 'true';
      if (isFeatured) {
        where.is_featured = true;
      }
    }

    if (query.search && query.search.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort === 'ending_soon') {
      orderBy = { deadline: 'asc' };
    } else if (query.sort === 'trending') {
      orderBy = { total_pool: 'desc' };
    } else if (query.sort === 'newest') {
      orderBy = { created_at: 'desc' };
    }

    const bets = await this.prisma.bet.findMany({
      where,
      orderBy,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        outcomes: {
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      success: true,
      data: bets.map((bet) => ({
        id: bet.id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        creator_id: bet.creator_id,
        status: bet.status,
        bet_type: bet.bet_type,
        is_private: bet.is_private,
        invite_code: bet.invite_code,
        deadline: bet.deadline,
        total_pool: bet.total_pool.toString(),
        back_pool: bet.back_pool.toString(),
        oppose_pool: bet.oppose_pool.toString(),
        is_featured: bet.is_featured,
        country: bet.country,
        outcomes: this.formatOutcomes(bet),
        comments_count: bet._count.comments,
        created_at: bet.created_at,
        creator: {
          id: bet.creator.id,
          name: bet.creator.name,
          username: bet.creator.username,
          avatar_url: bet.creator.avatar,
        },
      })),
    };
  }

  async exploreBets(query: QueryBetsDto) {
    return this.getPublicBets(query);
  }

  async getTrendingTopics() {
    const activeBets = await this.prisma.bet.findMany({
      where: {
        is_private: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        category: true,
        total_pool: true,
      },
    });

    const topicMap: Record<
      string,
      {
        tag: string;
        category: string;
        active_bets_count: number;
        total_volume: number;
      }
    > = {
      'Premier League': {
        tag: 'Premier League',
        category: 'SPORTS',
        active_bets_count: 0,
        total_volume: 0,
      },
      'US Elections': {
        tag: 'US Elections',
        category: 'POLITICS',
        active_bets_count: 0,
        total_volume: 0,
      },
      'Bitcoin & Crypto': {
        tag: 'Bitcoin & Crypto',
        category: 'CRYPTO',
        active_bets_count: 0,
        total_volume: 0,
      },
      'UEFA Champions League': {
        tag: 'UEFA Champions League',
        category: 'SPORTS',
        active_bets_count: 0,
        total_volume: 0,
      },
      'Box Office & Cinema': {
        tag: 'Box Office & Cinema',
        category: 'ENTERTAINMENT',
        active_bets_count: 0,
        total_volume: 0,
      },
    };

    for (const bet of activeBets) {
      const vol = parseFloat(String(bet.total_pool || '0'));
      const lower = bet.title.toLowerCase();

      if (
        lower.includes('arsenal') ||
        lower.includes('chelsea') ||
        lower.includes('premier') ||
        lower.includes('derby') ||
        bet.category === 'SPORTS'
      ) {
        topicMap['Premier League'].active_bets_count++;
        topicMap['Premier League'].total_volume += vol;
      }
      if (
        lower.includes('election') ||
        lower.includes('president') ||
        lower.includes('senate') ||
        bet.category === 'POLITICS'
      ) {
        topicMap['US Elections'].active_bets_count++;
        topicMap['US Elections'].total_volume += vol;
      }
      if (
        lower.includes('btc') ||
        lower.includes('crypto') ||
        lower.includes('bitcoin') ||
        lower.includes('eth') ||
        bet.category === 'CRYPTO'
      ) {
        topicMap['Bitcoin & Crypto'].active_bets_count++;
        topicMap['Bitcoin & Crypto'].total_volume += vol;
      }
      if (
        lower.includes('champions') ||
        lower.includes('uefa') ||
        lower.includes('madrid')
      ) {
        topicMap['UEFA Champions League'].active_bets_count++;
        topicMap['UEFA Champions League'].total_volume += vol;
      }
      if (
        bet.category === 'ENTERTAINMENT' ||
        lower.includes('movie') ||
        lower.includes('oscar')
      ) {
        topicMap['Box Office & Cinema'].active_bets_count++;
        topicMap['Box Office & Cinema'].total_volume += vol;
      }
    }

    return {
      success: true,
      message: 'Trending topics retrieved',
      data: Object.values(topicMap).sort(
        (a, b) => b.total_volume - a.total_volume,
      ),
    };
  }

  async getSupportedCountries() {
    const bets = await this.prisma.bet.findMany({
      where: { is_private: false },
      select: { country: true },
    });

    const counts: Record<string, number> = {
      GLOBAL: bets.length,
      US: 0,
      GB: 0,
      NG: 0,
      CA: 0,
    };

    for (const b of bets) {
      if (b.country && counts[b.country] !== undefined) {
        counts[b.country]++;
      }
    }

    return {
      success: true,
      message: 'Supported discovery countries retrieved',
      data: [
        { code: 'GLOBAL', name: 'Global / All', count: counts['GLOBAL'] || 0 },
        { code: 'US', name: 'United States', count: counts['US'] || 0 },
        { code: 'GB', name: 'United Kingdom', count: counts['GB'] || 0 },
        { code: 'NG', name: 'Nigeria', count: counts['NG'] || 0 },
        { code: 'CA', name: 'Canada', count: counts['CA'] || 0 },
      ],
    };
  }

  async getBetById(id: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        outcomes: {
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return {
      success: true,
      data: {
        id: bet.id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        creator_id: bet.creator_id,
        status: bet.status,
        bet_type: bet.bet_type,
        is_private: bet.is_private,
        invite_code: bet.invite_code,
        deadline: bet.deadline,
        total_pool: bet.total_pool.toString(),
        back_pool: bet.back_pool.toString(),
        oppose_pool: bet.oppose_pool.toString(),
        outcomes: this.formatOutcomes(bet),
        comments_count: bet._count.comments,
        created_at: bet.created_at,
        creator: {
          id: bet.creator.id,
          name: bet.creator.name,
          username: bet.creator.username,
          avatar_url: bet.creator.avatar,
        },
      },
    };
  }

  async createBet(creatorId: string, dto: CreateBetDto) {
    const stake = dto.initial_stake ? Number(dto.initial_stake) : 0;
    const isPrivate = dto.is_private === true;
    const betType = dto.bet_type ?? 'BINARY';
    const inviteCode = isPrivate
      ? `BET-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      : null;

    if (betType === 'CUSTOM') {
      if (!dto.outcomes || dto.outcomes.length < 2) {
        throw new BadRequestException(
          'Custom outcome bets require at least 2 distinct outcome options',
        );
      }

      const bet = await this.prisma.bet.create({
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category ?? 'SPORTS',
          creator_id: creatorId,
          status: 'ACTIVE',
          bet_type: 'CUSTOM',
          is_private: isPrivate,
          invite_code: inviteCode,
          country: dto.country ?? 'GLOBAL',
          deadline: new Date(dto.deadline),
          total_pool: stake,
          back_pool: 0,
          oppose_pool: 0,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      const targetInitialTitle = dto.initial_outcome ?? dto.outcomes[0];
      const createdOutcomes = [];

      for (const outcomeTitle of dto.outcomes) {
        const isSeeded =
          stake > 0 && outcomeTitle.trim() === targetInitialTitle.trim();
        const outcomePool = isSeeded ? stake : 0;
        const outcome = await this.prisma.betOutcome.create({
          data: {
            bet_id: bet.id,
            title: outcomeTitle.trim(),
            pool: outcomePool,
          },
        });
        createdOutcomes.push(outcome);

        if (isSeeded) {
          await this.prisma.betParticipant.create({
            data: {
              bet_id: bet.id,
              user_id: creatorId,
              outcome_id: outcome.id,
              side: outcome.title,
              stake,
            },
          });
        }
      }

      const betWithOutcomes = {
        ...bet,
        outcomes: createdOutcomes,
      };

      return {
        success: true,
        message: 'Bet created successfully',
        data: {
          id: bet.id,
          title: bet.title,
          description: bet.description,
          category: bet.category,
          creator_id: bet.creator_id,
          status: bet.status,
          bet_type: bet.bet_type,
          is_private: bet.is_private,
          invite_code: bet.invite_code,
          deadline: bet.deadline,
          total_pool: bet.total_pool.toString(),
          back_pool: '0.00',
          oppose_pool: '0.00',
          outcomes: this.formatOutcomes(betWithOutcomes),
          comments_count: 0,
          created_at: bet.created_at,
          creator: {
            id: bet.creator.id,
            name: bet.creator.name,
            username: bet.creator.username,
            avatar_url: bet.creator.avatar,
          },
        },
      };
    }

    const isOppose = dto.initial_side === 'OPPOSE';
    const backPool = isOppose ? 0 : stake;
    const opposePool = isOppose ? stake : 0;
    const totalPool = stake;

    const bet = await this.prisma.bet.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'SPORTS',
        creator_id: creatorId,
        status: 'ACTIVE',
        bet_type: 'BINARY',
        is_private: isPrivate,
        invite_code: inviteCode,
        country: dto.country ?? 'GLOBAL',
        deadline: new Date(dto.deadline),
        total_pool: totalPool,
        back_pool: backPool,
        oppose_pool: opposePool,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (stake > 0) {
      await this.prisma.betParticipant.create({
        data: {
          bet_id: bet.id,
          user_id: creatorId,
          side: dto.initial_side ?? 'BACK',
          stake,
        },
      });
    }

    return {
      success: true,
      message: 'Bet created successfully',
      data: {
        id: bet.id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        creator_id: bet.creator_id,
        status: bet.status,
        bet_type: bet.bet_type,
        is_private: bet.is_private,
        invite_code: bet.invite_code,
        deadline: bet.deadline,
        total_pool: bet.total_pool.toString(),
        back_pool: bet.back_pool.toString(),
        oppose_pool: bet.oppose_pool.toString(),
        outcomes: this.formatOutcomes(bet),
        comments_count: 0,
        created_at: bet.created_at,
        creator: {
          id: bet.creator.id,
          name: bet.creator.name,
          username: bet.creator.username,
          avatar_url: bet.creator.avatar,
        },
      },
    };
  }

  async getBetByInviteCode(inviteCode: string) {
    const bet = await this.prisma.bet.findFirst({
      where: {
        invite_code: {
          equals: inviteCode.trim(),
          mode: 'insensitive',
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: 'asc',
          },
        },
        outcomes: {
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet with invite code not found');
    }

    return {
      success: true,
      data: {
        id: bet.id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        creator_id: bet.creator_id,
        status: bet.status,
        bet_type: bet.bet_type,
        is_private: bet.is_private,
        invite_code: bet.invite_code,
        deadline: bet.deadline,
        total_pool: bet.total_pool.toString(),
        back_pool: bet.back_pool.toString(),
        oppose_pool: bet.oppose_pool.toString(),
        outcomes: this.formatOutcomes(bet),
        comments_count: bet._count.comments,
        created_at: bet.created_at,
        creator: {
          id: bet.creator.id,
          name: bet.creator.name,
          username: bet.creator.username,
          avatar_url: bet.creator.avatar,
        },
        participants: bet.participants.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          side: p.side,
          stake: p.stake.toString(),
          created_at: p.created_at,
          user: {
            id: p.user.id,
            name: p.user.name,
            username: p.user.username,
            avatar_url: p.user.avatar,
          },
        })),
      },
    };
  }

  async joinBetByInviteCode(
    inviteCode: string,
    userId: string,
    dto: JoinBetDto,
  ) {
    const bet = await this.prisma.bet.findFirst({
      where: {
        invite_code: {
          equals: inviteCode.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet with invite code not found');
    }

    if (bet.status !== 'ACTIVE') {
      throw new ForbiddenException('This bet is no longer active');
    }

    if (bet.deadline && new Date() > bet.deadline) {
      throw new ForbiddenException('The deadline for this bet has passed');
    }

    const stake = Number(dto.stake);

    if (dto.outcome_id) {
      const outcome = await this.prisma.betOutcome.findFirst({
        where: { id: dto.outcome_id, bet_id: bet.id },
      });

      if (!outcome) {
        throw new NotFoundException('Outcome option not found for this bet');
      }

      await this.prisma.betOutcome.update({
        where: { id: outcome.id },
        data: { pool: { increment: stake } },
      });

      const updatedBet = await this.prisma.bet.update({
        where: { id: bet.id },
        data: { total_pool: { increment: stake } },
        include: { outcomes: { orderBy: { created_at: 'asc' } } },
      });

      const participant = await this.prisma.betParticipant.upsert({
        where: {
          bet_id_user_id_side: {
            bet_id: bet.id,
            user_id: userId,
            side: outcome.title,
          },
        },
        create: {
          bet_id: bet.id,
          user_id: userId,
          outcome_id: outcome.id,
          side: outcome.title,
          stake,
        },
        update: {
          stake: { increment: stake },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Joined bet successfully',
        data: {
          bet: {
            id: updatedBet.id,
            total_pool: updatedBet.total_pool.toString(),
            outcomes: this.formatOutcomes(updatedBet),
          },
          participant: {
            id: participant.id,
            bet_id: participant.bet_id,
            user_id: participant.user_id,
            outcome_id: participant.outcome_id,
            side: participant.side,
            stake: participant.stake.toString(),
            created_at: participant.created_at,
            user: {
              id: participant.user.id,
              name: participant.user.name,
              username: participant.user.username,
              avatar_url: participant.user.avatar,
            },
          },
        },
      };
    }

    const side = dto.side ?? 'BACK';
    const isOppose = side === 'OPPOSE';

    const updatedBet = await this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        total_pool: { increment: stake },
        ...(isOppose
          ? { oppose_pool: { increment: stake } }
          : { back_pool: { increment: stake } }),
      },
      include: { outcomes: { orderBy: { created_at: 'asc' } } },
    });

    const participant = await this.prisma.betParticipant.upsert({
      where: {
        bet_id_user_id_side: {
          bet_id: bet.id,
          user_id: userId,
          side,
        },
      },
      create: {
        bet_id: bet.id,
        user_id: userId,
        side,
        stake,
      },
      update: {
        stake: { increment: stake },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Joined bet successfully',
      data: {
        bet: {
          id: updatedBet.id,
          total_pool: updatedBet.total_pool.toString(),
          back_pool: updatedBet.back_pool.toString(),
          oppose_pool: updatedBet.oppose_pool.toString(),
          outcomes: this.formatOutcomes(updatedBet),
        },
        participant: {
          id: participant.id,
          bet_id: participant.bet_id,
          user_id: participant.user_id,
          side: participant.side,
          stake: participant.stake.toString(),
          created_at: participant.created_at,
          user: {
            id: participant.user.id,
            name: participant.user.name,
            username: participant.user.username,
            avatar_url: participant.user.avatar,
          },
        },
      },
    };
  }

  async placeStake(betId: string, userId: string, dto: PlaceStakeDto) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        outcomes: true,
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'ACTIVE') {
      throw new ForbiddenException('This bet is no longer active');
    }

    if (bet.deadline && new Date() > bet.deadline) {
      throw new ForbiddenException('The deadline for this bet has passed');
    }

    const stake = Number(dto.stake);

    if (dto.outcome_id) {
      const outcome = await this.prisma.betOutcome.findFirst({
        where: { id: dto.outcome_id, bet_id: betId },
      });

      if (!outcome) {
        throw new NotFoundException('Outcome option not found for this bet');
      }

      await this.prisma.betOutcome.update({
        where: { id: outcome.id },
        data: { pool: { increment: stake } },
      });

      const updatedBet = await this.prisma.bet.update({
        where: { id: bet.id },
        data: { total_pool: { increment: stake } },
        include: { outcomes: { orderBy: { created_at: 'asc' } } },
      });

      const participant = await this.prisma.betParticipant.upsert({
        where: {
          bet_id_user_id_side: {
            bet_id: bet.id,
            user_id: userId,
            side: outcome.title,
          },
        },
        create: {
          bet_id: bet.id,
          user_id: userId,
          outcome_id: outcome.id,
          side: outcome.title,
          stake,
        },
        update: {
          stake: { increment: stake },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Stake placed successfully',
        data: {
          bet: {
            id: updatedBet.id,
            total_pool: updatedBet.total_pool.toString(),
            outcomes: this.formatOutcomes(updatedBet),
          },
          participant: {
            id: participant.id,
            bet_id: participant.bet_id,
            user_id: participant.user_id,
            outcome_id: participant.outcome_id,
            side: participant.side,
            stake: participant.stake.toString(),
            created_at: participant.created_at,
            user: {
              id: participant.user.id,
              name: participant.user.name,
              username: participant.user.username,
              avatar_url: participant.user.avatar,
            },
          },
        },
      };
    }

    const side = dto.side ?? 'BACK';
    const isOppose = side === 'OPPOSE';

    const updatedBet = await this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        total_pool: { increment: stake },
        ...(isOppose
          ? { oppose_pool: { increment: stake } }
          : { back_pool: { increment: stake } }),
      },
      include: { outcomes: { orderBy: { created_at: 'asc' } } },
    });

    const participant = await this.prisma.betParticipant.upsert({
      where: {
        bet_id_user_id_side: {
          bet_id: bet.id,
          user_id: userId,
          side,
        },
      },
      create: {
        bet_id: bet.id,
        user_id: userId,
        side,
        stake,
      },
      update: {
        stake: { increment: stake },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Stake placed successfully',
      data: {
        bet: {
          id: updatedBet.id,
          total_pool: updatedBet.total_pool.toString(),
          back_pool: updatedBet.back_pool.toString(),
          oppose_pool: updatedBet.oppose_pool.toString(),
          outcomes: this.formatOutcomes(updatedBet),
        },
        participant: {
          id: participant.id,
          bet_id: participant.bet_id,
          user_id: participant.user_id,
          side: participant.side,
          stake: participant.stake.toString(),
          created_at: participant.created_at,
          user: {
            id: participant.user.id,
            name: participant.user.name,
            username: participant.user.username,
            avatar_url: participant.user.avatar,
          },
        },
      },
    };
  }

  async getBetOutcomes(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        outcomes: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return {
      success: true,
      data: this.formatOutcomes(bet),
    };
  }

  async getBetParticipants(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      select: { id: true },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const participants = await this.prisma.betParticipant.findMany({
      where: { bet_id: betId },
      orderBy: { created_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: participants.map((p) => ({
        id: p.id,
        bet_id: p.bet_id,
        user_id: p.user_id,
        outcome_id: p.outcome_id,
        side: p.side,
        stake: p.stake.toString(),
        matched_stake: (p.matched_stake ?? '0.00').toString(),
        unmatched_stake: (p.unmatched_stake ?? '0.00').toString(),
        match_status: p.match_status ?? 'UNMATCHED',
        refunded_amount: (p.refunded_amount ?? '0.00').toString(),
        created_at: p.created_at,
        user: {
          id: p.user.id,
          name: p.user.name,
          username: p.user.username,
          avatar_url: p.user.avatar,
        },
      })),
    };
  }

  async recalculateBetMatches(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        participants: true,
        outcomes: true,
      },
    });

    if (!bet) return null;

    const isCustom = bet.bet_type === 'CUSTOM';
    const participants = bet.participants || [];

    if (isCustom) {
      const outcomes = bet.outcomes || [];
      const totalPool = outcomes.reduce(
        (sum, o) => sum + Number(o.pool || 0),
        0,
      );

      let totalMatchedPool = 0;
      const outcomeRatios: Record<string, number> = {};

      for (const outcome of outcomes) {
        const pool = Number(outcome.pool || 0);
        const opposingPool = totalPool - pool;
        const matched = Math.min(pool, opposingPool);
        const ratio = pool > 0 ? Math.min(1.0, matched / pool) : 0;
        outcomeRatios[outcome.title] = ratio;
        if (outcome.id) {
          outcomeRatios[outcome.id] = ratio;
        }
        totalMatchedPool += matched;
      }

      const totalUnmatchedPool = Math.max(0, totalPool - totalMatchedPool);

      for (const p of participants) {
        const stake = Number(p.stake || 0);
        const ratio =
          (p.outcome_id ? outcomeRatios[p.outcome_id] : null) ??
          outcomeRatios[p.side] ??
          0;
        const matchedStake = Number((stake * ratio).toFixed(2));
        const unmatchedStake = Number((stake - matchedStake).toFixed(2));
        let matchStatus = 'UNMATCHED';
        if (matchedStake >= stake && stake > 0) {
          matchStatus = 'MATCHED';
        } else if (matchedStake > 0) {
          matchStatus = 'PARTIALLY_MATCHED';
        }

        await this.prisma.betParticipant.update({
          where: { id: p.id },
          data: {
            matched_stake: matchedStake,
            unmatched_stake: unmatchedStake,
            match_status: matchStatus,
          },
        });
      }

      await this.prisma.bet.update({
        where: { id: bet.id },
        data: {
          matched_pool: totalMatchedPool,
          unmatched_pool: totalUnmatchedPool,
        },
      });

      return {
        total_pool: totalPool,
        matched_pool: totalMatchedPool,
        unmatched_pool: totalUnmatchedPool,
      };
    } else {
      const backPool = Number(bet.back_pool || 0);
      const opposePool = Number(bet.oppose_pool || 0);
      const totalPool = backPool + opposePool;

      const matchedSide = Math.min(backPool, opposePool);
      const totalMatchedPool = matchedSide * 2;
      const totalUnmatchedPool = Math.max(0, totalPool - totalMatchedPool);

      const backRatio =
        backPool > 0 ? Math.min(1.0, matchedSide / backPool) : 0;
      const opposeRatio =
        opposePool > 0 ? Math.min(1.0, matchedSide / opposePool) : 0;

      for (const p of participants) {
        const stake = Number(p.stake || 0);
        const ratio = p.side === 'OPPOSE' ? opposeRatio : backRatio;
        const matchedStake = Number((stake * ratio).toFixed(2));
        const unmatchedStake = Number((stake - matchedStake).toFixed(2));
        let matchStatus = 'UNMATCHED';
        if (matchedStake >= stake && stake > 0) {
          matchStatus = 'MATCHED';
        } else if (matchedStake > 0) {
          matchStatus = 'PARTIALLY_MATCHED';
        }

        await this.prisma.betParticipant.update({
          where: { id: p.id },
          data: {
            matched_stake: matchedStake,
            unmatched_stake: unmatchedStake,
            match_status: matchStatus,
          },
        });
      }

      await this.prisma.bet.update({
        where: { id: bet.id },
        data: {
          matched_pool: totalMatchedPool,
          unmatched_pool: totalUnmatchedPool,
        },
      });

      return {
        total_pool: totalPool,
        matched_pool: totalMatchedPool,
        unmatched_pool: totalUnmatchedPool,
        back_matched: matchedSide,
        oppose_matched: matchedSide,
        back_unmatched: Math.max(0, backPool - matchedSide),
        oppose_unmatched: Math.max(0, opposePool - matchedSide),
      };
    }
  }

  async getMatchedStatus(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
        outcomes: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const backPool = Number(bet.back_pool || 0);
    const opposePool = Number(bet.oppose_pool || 0);
    const totalPool = Number(bet.total_pool || 0);
    const matchedSide = Math.min(backPool, opposePool);
    const matchedPool = Number(bet.matched_pool) || matchedSide * 2;
    const unmatchedPool =
      Number(bet.unmatched_pool) || Math.max(0, totalPool - matchedPool);

    // Live Decimal Odds
    const backOdds = backPool > 0 ? (totalPool / backPool).toFixed(2) : '2.00';
    const opposeOdds =
      opposePool > 0 ? (totalPool / opposePool).toFixed(2) : '2.00';

    return {
      success: true,
      data: {
        bet_id: bet.id,
        bet_type: bet.bet_type,
        total_pool: totalPool.toFixed(2),
        matched_pool: matchedPool.toFixed(2),
        unmatched_pool: unmatchedPool.toFixed(2),
        back_pool: backPool.toFixed(2),
        oppose_pool: opposePool.toFixed(2),
        back_matched: matchedSide.toFixed(2),
        oppose_matched: matchedSide.toFixed(2),
        back_unmatched: Math.max(0, backPool - matchedSide).toFixed(2),
        oppose_unmatched: Math.max(0, opposePool - matchedSide).toFixed(2),
        back_odds: backOdds,
        oppose_odds: opposeOdds,
        participants: (bet.participants || []).map((p) => ({
          id: p.id,
          user_id: p.user_id,
          outcome_id: p.outcome_id,
          side: p.side,
          stake: p.stake.toString(),
          matched_stake: (p.matched_stake ?? '0.00').toString(),
          unmatched_stake: (p.unmatched_stake ?? '0.00').toString(),
          match_status: p.match_status ?? 'UNMATCHED',
          refunded_amount: (p.refunded_amount ?? '0.00').toString(),
          user: p.user,
        })),
      },
    };
  }

  async refundUnmatchedStakes(betId: string, _currentUserId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        participants: true,
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    await this.recalculateBetMatches(betId);

    const refreshedParticipants = await this.prisma.betParticipant.findMany({
      where: { bet_id: betId },
    });

    let refundedCount = 0;
    let totalRefunded = 0;

    for (const p of refreshedParticipants) {
      const unmatched = Number(p.unmatched_stake || 0);
      if (unmatched > 0) {
        await this.prisma.user.update({
          where: { id: p.user_id },
          data: {
            balance: { increment: unmatched },
          },
        });

        await this.prisma.betParticipant.update({
          where: { id: p.id },
          data: {
            unmatched_stake: 0,
            refunded_amount: { increment: unmatched },
            match_status: Number(p.matched_stake) > 0 ? 'MATCHED' : 'REFUNDED',
          },
        });

        refundedCount++;
        totalRefunded += unmatched;
      }
    }

    await this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        unmatched_pool: 0,
      },
    });

    return {
      success: true,
      message: 'Unmatched stakes refunded successfully',
      data: {
        bet_id: bet.id,
        refunded_count: refundedCount,
        total_refunded: totalRefunded.toFixed(2),
      },
    };
  }

  async getBetComments(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      select: { id: true },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const comments = await this.prisma.betComment.findMany({
      where: { bet_id: betId },
      orderBy: { created_at: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        bet_id: c.bet_id,
        content: c.content,
        stance: c.stance ?? 'SPECTATOR',
        created_at: c.created_at,
        author: {
          id: c.author.id,
          name: c.author.name,
          username: c.author.username,
          avatar_url: c.author.avatar,
        },
      })),
    };
  }

  async createBetComment(
    betId: string,
    authorId: string,
    dto: CreateBetCommentDto,
  ) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      select: { id: true },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const comment = await this.prisma.betComment.create({
      data: {
        bet_id: betId,
        author_id: authorId,
        content: dto.content,
        stance: dto.stance ?? 'SPECTATOR',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Comment posted successfully',
      data: {
        id: comment.id,
        bet_id: comment.bet_id,
        content: comment.content,
        stance: comment.stance ?? 'SPECTATOR',
        created_at: comment.created_at,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          username: comment.author.username,
          avatar_url: comment.author.avatar,
        },
      },
    };
  }

  async deleteBetComment(betId: string, commentId: string, userId: string) {
    const comment = await this.prisma.betComment.findFirst({
      where: { id: commentId, bet_id: betId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.betComment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }

  async getEscrowStatus(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        outcomes: { orderBy: { created_at: 'asc' } },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
            outcome: true,
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const totalEscrow = Number(bet.total_pool || 0);
    const matchedPool = Number(bet.matched_pool || 0);
    const unmatchedPool = Number(bet.unmatched_pool || 0);
    const payoutPool =
      Number(bet.payout_pool || 0) > 0 ? Number(bet.payout_pool) : matchedPool;

    const winnersCount = bet.participants.filter(
      (p) => p.is_winner === true,
    ).length;
    const losersCount = bet.participants.filter(
      (p) => p.is_winner === false,
    ).length;

    const payouts = bet.participants.map((p) => {
      const stakeNum = Number(p.stake || 0);
      const matchedNum = Number(p.matched_stake || 0);
      const payoutNum = Number(p.payout_amount || 0);
      const profit = p.is_winner ? Math.max(0, payoutNum - matchedNum) : 0;
      const roiPercent =
        matchedNum > 0 && p.is_winner
          ? Number(((profit / matchedNum) * 100).toFixed(1))
          : 0;

      return {
        participant_id: p.id,
        user_id: p.user_id,
        user_name: p.user.name || p.user.username || 'Bettor',
        side: p.side,
        outcome_id: p.outcome_id,
        outcome_title: p.outcome?.title,
        stake: stakeNum.toFixed(2),
        matched_stake: matchedNum.toFixed(2),
        payout_amount: payoutNum.toFixed(2),
        profit: profit.toFixed(2),
        roi_percent: roiPercent,
        is_winner: p.is_winner,
        payout_status: p.payout_status || 'PENDING',
      };
    });

    return {
      success: true,
      data: {
        bet_id: bet.id,
        title: bet.title,
        status: bet.status,
        escrow_status: bet.escrow_status || 'LOCKED',
        total_escrow: totalEscrow.toFixed(2),
        matched_pool: matchedPool.toFixed(2),
        unmatched_pool: unmatchedPool.toFixed(2),
        payout_pool: payoutPool.toFixed(2),
        winning_side: bet.winning_side,
        winning_outcome_id: bet.winning_outcome_id,
        resolved_at: bet.resolved_at,
        winners_count: winnersCount,
        losers_count: losersCount,
        payouts,
      },
    };
  }

  async resolveBet(betId: string, dto: ResolveBetDto, _currentUserId?: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        outcomes: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status === 'RESOLVED') {
      throw new BadRequestException('Bet has already been resolved');
    }

    // Recalculate matches first to ensure matched/unmatched stakes are up to date
    await this.recalculateBetMatches(betId);

    const refreshedBet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        outcomes: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    const isCustom = refreshedBet!.bet_type === 'CUSTOM';
    let winningSide: string | undefined = undefined;
    let winningOutcomeId: string | undefined = undefined;

    if (isCustom) {
      if (!dto.winning_outcome_id) {
        throw new BadRequestException(
          'winning_outcome_id is required for custom outcome bets',
        );
      }
      const outcome = refreshedBet!.outcomes.find(
        (o) => o.id === dto.winning_outcome_id,
      );
      if (!outcome) {
        throw new NotFoundException('Winning outcome not found');
      }
      winningOutcomeId = outcome.id;
      winningSide = outcome.title;

      // Update outcomes is_winner flags
      for (const o of refreshedBet!.outcomes) {
        await this.prisma.betOutcome.update({
          where: { id: o.id },
          data: { is_winner: o.id === winningOutcomeId },
        });
      }
    } else {
      if (!dto.winning_side || !['BACK', 'OPPOSE'].includes(dto.winning_side)) {
        throw new BadRequestException(
          'winning_side must be BACK or OPPOSE for binary bets',
        );
      }
      winningSide = dto.winning_side;
    }

    // Determine winners vs losers
    const winners = refreshedBet!.participants.filter((p) => {
      if (isCustom) {
        return p.outcome_id === winningOutcomeId;
      }
      return p.side === winningSide;
    });

    const losers = refreshedBet!.participants.filter((p) => {
      if (isCustom) {
        return p.outcome_id !== winningOutcomeId;
      }
      return p.side !== winningSide;
    });

    const matchedPool = Number(refreshedBet!.matched_pool || 0);
    const totalWinningMatchedStake = winners.reduce(
      (sum, p) => sum + Number(p.matched_stake || 0),
      0,
    );

    const feeConfig = await this.prisma.platformFeeConfig.findFirst({
      orderBy: { created_at: 'desc' },
    });
    const commissionRate = feeConfig ? Number(feeConfig.commission_rate) : 10.0;

    let totalPaidOut = 0;
    let totalCommissionCollected = 0;
    let totalGrossPaidOut = 0;
    let totalRefundedUnmatched = 0;
    const payoutResults: Array<{
      participant_id: string;
      user_id: string;
      matched_stake: string;
      payout_amount: string;
      is_winner: boolean;
    }> = [];

    if (totalWinningMatchedStake > 0 && matchedPool > 0) {
      // Proportional distribution of matched pool to winners minus platform commission on net profit
      for (const winner of winners) {
        const winnerMatched = Number(winner.matched_stake || 0);
        const winnerShareRatio = winnerMatched / totalWinningMatchedStake;
        const grossPayout = Number((winnerShareRatio * matchedPool).toFixed(2));
        const netProfit = Math.max(0, grossPayout - winnerMatched);
        const commissionDeducted = Number(
          ((netProfit * commissionRate) / 100).toFixed(2),
        );
        const netPayout = Number((grossPayout - commissionDeducted).toFixed(2));
        const unmatched = Number(winner.unmatched_stake || 0);

        // Credit net payout + any unmatched stake to winner balance
        const totalCredit = netPayout + unmatched;
        await this.prisma.user.update({
          where: { id: winner.user_id },
          data: {
            balance: { increment: totalCredit },
            wins: { increment: 1 },
          },
        });

        await this.prisma.betParticipant.update({
          where: { id: winner.id },
          data: {
            is_winner: true,
            payout_amount: netPayout,
            gross_payout: grossPayout,
            commission_deducted: commissionDeducted,
            net_payout: netPayout,
            payout_status: 'PAID',
            unmatched_stake: 0,
            refunded_amount: { increment: unmatched },
          },
        });

        totalPaidOut += netPayout;
        totalGrossPaidOut += grossPayout;
        totalCommissionCollected += commissionDeducted;
        totalRefundedUnmatched += unmatched;

        payoutResults.push({
          participant_id: winner.id,
          user_id: winner.user_id,
          matched_stake: winnerMatched.toFixed(2),
          payout_amount: netPayout.toFixed(2),
          is_winner: true,
        });
      }

      // Losers: matched stake lost, but any unmatched stake refunded to wallet
      for (const loser of losers) {
        const unmatched = Number(loser.unmatched_stake || 0);
        if (unmatched > 0) {
          await this.prisma.user.update({
            where: { id: loser.user_id },
            data: {
              balance: { increment: unmatched },
              losses: { increment: 1 },
            },
          });
          totalRefundedUnmatched += unmatched;
        } else {
          await this.prisma.user.update({
            where: { id: loser.user_id },
            data: {
              losses: { increment: 1 },
            },
          });
        }

        await this.prisma.betParticipant.update({
          where: { id: loser.id },
          data: {
            is_winner: false,
            payout_amount: 0,
            gross_payout: 0,
            commission_deducted: 0,
            net_payout: 0,
            payout_status: 'LOST',
            unmatched_stake: 0,
            refunded_amount: { increment: unmatched },
          },
        });
      }
    } else {
      // Edge case: No winning matched stakes (e.g. only unmatched participants), refund everyone
      for (const p of refreshedBet!.participants) {
        const stakeNum = Number(p.stake || 0);
        await this.prisma.user.update({
          where: { id: p.user_id },
          data: {
            balance: { increment: stakeNum },
          },
        });
        await this.prisma.betParticipant.update({
          where: { id: p.id },
          data: {
            is_winner: false,
            payout_amount: 0,
            payout_status: 'REFUNDED',
            unmatched_stake: 0,
            refunded_amount: stakeNum,
          },
        });
        totalRefundedUnmatched += stakeNum;
      }
    }

    // Update Bet record
    const resolvedBet = await this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: 'RESOLVED',
        escrow_status: 'SETTLED',
        winning_side: winningSide,
        winning_outcome_id: winningOutcomeId,
        resolved_at: new Date(),
        payout_pool: totalGrossPaidOut,
        commission_rate: commissionRate,
        commission_amount: totalCommissionCollected,
        unmatched_pool: 0,
      },
    });

    return {
      success: true,
      message: 'Bet resolved successfully and escrow payouts distributed',
      data: {
        bet_id: resolvedBet.id,
        status: resolvedBet.status,
        escrow_status: resolvedBet.escrow_status,
        winning_side: resolvedBet.winning_side,
        winning_outcome_id: resolvedBet.winning_outcome_id,
        total_payout: totalPaidOut.toFixed(2),
        total_refunded_unmatched: totalRefundedUnmatched.toFixed(2),
        winners_count: winners.length,
        payouts: payoutResults,
      },
    };
  }

  async getBetCommission(betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    const commissionRate = bet.commission_rate
      ? Number(bet.commission_rate)
      : 10.0;
    const totalCommission = bet.commission_amount
      ? Number(bet.commission_amount)
      : 0.0;
    const grossPayoutPool = bet.payout_pool
      ? Number(bet.payout_pool)
      : Number(bet.matched_pool || 0);
    const netPayoutPool = Math.max(0, grossPayoutPool - totalCommission);

    const participantFees = bet.participants.map((p) => {
      const matched = Number(p.matched_stake || 0);
      const gross = Number(p.gross_payout || p.payout_amount || 0);
      const fee = Number(p.commission_deducted || 0);
      const net = Number(p.net_payout || p.payout_amount || 0);
      const netProfit = Math.max(0, gross - matched);

      return {
        participant_id: p.id,
        user_id: p.user_id,
        user_name: p.user?.name || p.user?.username || 'Bettor',
        side: p.side,
        matched_stake: matched.toFixed(2),
        gross_payout: gross.toFixed(2),
        net_profit: netProfit.toFixed(2),
        commission_deducted: fee.toFixed(2),
        net_payout: net.toFixed(2),
      };
    });

    return {
      success: true,
      data: {
        bet_id: bet.id,
        title: bet.title,
        status: bet.status,
        commission_rate: commissionRate.toFixed(1),
        gross_payout_pool: grossPayoutPool.toFixed(2),
        total_commission_collected: totalCommission.toFixed(2),
        net_payout_pool: netPayoutPool.toFixed(2),
        participant_fees: participantFees,
      },
    };
  }
}
