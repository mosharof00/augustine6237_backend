import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getUserPosts(userId: string, currentUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.prisma.postCommunity.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        likes: {
          select: {
            user_id: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return {
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        caption: post.content ?? post.title ?? '',
        image_url: post.image_url,
        location_tag: post.location_tag,
        created_at: post.created_at,
        likes_count: post._count.likes,
        comments_count: post._count.comments,
        is_liked: currentUserId
          ? post.likes.some((like) => like.user_id === currentUserId)
          : false,
        author: {
          id: post.user.id,
          name: post.user.name,
          username: post.user.username,
          avatar_url: post.user.avatar,
        },
      })),
    };
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    if (!dto.caption && !dto.image_url) {
      throw new BadRequestException(
        'Either caption or image_url must be provided',
      );
    }

    const post = await this.prisma.postCommunity.create({
      data: {
        author_id: authorId,
        content: dto.caption,
        title: dto.caption ? dto.caption.slice(0, 50) : null,
        image_url: dto.image_url,
        location_tag: dto.location_tag,
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
      message: 'Post created successfully',
      data: {
        id: post.id,
        caption: post.content ?? '',
        image_url: post.image_url,
        location_tag: post.location_tag,
        created_at: post.created_at,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        author: {
          id: post.user.id,
          name: post.user.name,
          username: post.user.username,
          avatar_url: post.user.avatar,
        },
      },
    };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.postCommunity.findFirst({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.postCommunity.delete({
      where: { id: postId },
    });

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.postCommunity.findFirst({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    let isLiked = false;
    if (existingLike) {
      await this.prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await this.prisma.postLike.create({
        data: {
          post_id: postId,
          user_id: userId,
        },
      });
      isLiked = true;
    }

    const likesCount = await this.prisma.postLike.count({
      where: { post_id: postId },
    });

    return {
      success: true,
      data: {
        is_liked: isLiked,
        likes_count: likesCount,
      },
    };
  }
}
