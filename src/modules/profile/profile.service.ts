import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string, currentUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        location: true,
        type: true,
        balance: true,
        wins: true,
        losses: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const [followersCount, followingCount, isFollowingRecord, reviews] =
      await Promise.all([
        this.prisma.userFollow.count({ where: { following_id: userId } }),
        this.prisma.userFollow.count({ where: { follower_id: userId } }),
        currentUserId
          ? this.prisma.userFollow.findUnique({
              where: {
                follower_id_following_id: {
                  follower_id: currentUserId,
                  following_id: userId,
                },
              },
            })
          : Promise.resolve(null),
        this.prisma.userReview.aggregate({
          where: { user_id: userId },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

    const wins = user.wins ?? 0;
    const losses = user.losses ?? 0;
    const totalBets = wins + losses;
    const winRate =
      totalBets > 0 ? Number(((wins / totalBets) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name ?? user.username ?? 'Bettor',
        username: user.username,
        avatar: user.avatar,
        avatar_url: user.avatar,
        bio: user.bio,
        location: user.location,
        type: user.type,
        balance: user.balance ? user.balance.toString() : '0.00',
        followers_count: followersCount,
        following_count: followingCount,
        is_following: Boolean(isFollowingRecord),
        stats: {
          wins,
          losses,
          total_bets: totalBets,
          win_rate: winRate,
          roi:
            totalBets > 0
              ? Number(
                  (((wins * 1.8 - totalBets) / totalBets) * 100).toFixed(1),
                )
              : 0,
        },
        rating: {
          average: reviews._avg.rating
            ? Number(reviews._avg.rating.toFixed(1))
            : 5.0,
          count: reviews._count.rating ?? 0,
        },
      },
    };
  }

  async toggleFollow(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUserId,
          following_id: targetUserId,
        },
      },
    });

    let isFollowing = false;
    if (existingFollow) {
      await this.prisma.userFollow.delete({
        where: { id: existingFollow.id },
      });
      isFollowing = false;
    } else {
      await this.prisma.userFollow.create({
        data: {
          follower_id: currentUserId,
          following_id: targetUserId,
        },
      });
      isFollowing = true;
    }

    const followersCount = await this.prisma.userFollow.count({
      where: { following_id: targetUserId },
    });

    return {
      success: true,
      message: isFollowing
        ? 'Followed successfully'
        : 'Unfollowed successfully',
      data: {
        is_following: isFollowing,
        followers_count: followersCount,
      },
    };
  }

  async getReviews(userId: string) {
    const reviews = await this.prisma.userReview.findMany({
      where: { user_id: userId },
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
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        author: {
          id: r.author.id,
          name: r.author.name ?? r.author.username ?? 'Anonymous',
          username: r.author.username,
          avatar_url: r.author.avatar,
        },
      })),
    };
  }

  async createReview(
    targetUserId: string,
    authorId: string,
    dto: CreateReviewDto,
  ) {
    if (targetUserId === authorId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const review = await this.prisma.userReview.create({
      data: {
        author_id: authorId,
        user_id: targetUserId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    return {
      success: true,
      message: 'Review submitted successfully',
      data: review,
    };
  }
}
