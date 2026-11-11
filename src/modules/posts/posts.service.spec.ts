import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    postCommunity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPosts', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.getUserPosts('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return posts for an existing user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.postCommunity.findMany.mockResolvedValue([
        {
          id: 'post-1',
          content: 'Arsenal vs Chelsea bet',
          image_url: 'https://example.com/img.jpg',
          location_tag: 'London',
          created_at: new Date('2026-11-10T16:00:00Z'),
          user: {
            id: 'user-1',
            name: 'Alex Mercer',
            username: 'alexm',
            avatar: null,
          },
          likes: [{ user_id: 'viewer-1' }],
          _count: {
            likes: 1,
            comments: 3,
          },
        },
      ]);

      const res = await service.getUserPosts('user-1', 'viewer-1');
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('post-1');
      expect(res.data[0].caption).toBe('Arsenal vs Chelsea bet');
      expect(res.data[0].is_liked).toBe(true);
      expect(res.data[0].likes_count).toBe(1);
      expect(res.data[0].comments_count).toBe(3);
    });
  });

  describe('createPost', () => {
    it('should throw BadRequestException if both caption and image_url are missing', async () => {
      await expect(service.createPost('user-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create post successfully', async () => {
      mockPrismaService.postCommunity.create.mockResolvedValue({
        id: 'post-new',
        content: 'New Bet Prediction',
        image_url: 'https://img.com/bet.jpg',
        location_tag: 'UK',
        created_at: new Date('2026-11-10T16:00:00Z'),
        user: {
          id: 'user-1',
          name: 'Alex',
          username: 'alexm',
          avatar: null,
        },
      });

      const res = await service.createPost('user-1', {
        caption: 'New Bet Prediction',
        image_url: 'https://img.com/bet.jpg',
        location_tag: 'UK',
      });

      expect(res.success).toBe(true);
      expect(res.data.id).toBe('post-new');
      expect(res.data.caption).toBe('New Bet Prediction');
    });
  });

  describe('deletePost', () => {
    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.postCommunity.findFirst.mockResolvedValue(null);

      await expect(service.deletePost('p-404', 'u-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not author', async () => {
      mockPrismaService.postCommunity.findFirst.mockResolvedValue({
        id: 'p-1',
        author_id: 'other-user',
      });

      await expect(service.deletePost('p-1', 'u-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete post when user is author', async () => {
      mockPrismaService.postCommunity.findFirst.mockResolvedValue({
        id: 'p-1',
        author_id: 'u-1',
      });
      mockPrismaService.postCommunity.delete.mockResolvedValue({});

      const res = await service.deletePost('p-1', 'u-1');
      expect(res.success).toBe(true);
      expect(mockPrismaService.postCommunity.delete).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
    });
  });

  describe('toggleLike', () => {
    it('should like post when not already liked', async () => {
      mockPrismaService.postCommunity.findFirst.mockResolvedValue({
        id: 'p-1',
      });
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);
      mockPrismaService.postLike.create.mockResolvedValue({});
      mockPrismaService.postLike.count.mockResolvedValue(1);

      const res = await service.toggleLike('p-1', 'u-1');
      expect(res.success).toBe(true);
      expect(res.data.is_liked).toBe(true);
      expect(res.data.likes_count).toBe(1);
    });

    it('should unlike post when already liked', async () => {
      mockPrismaService.postCommunity.findFirst.mockResolvedValue({
        id: 'p-1',
      });
      mockPrismaService.postLike.findUnique.mockResolvedValue({ id: 'like-1' });
      mockPrismaService.postLike.delete.mockResolvedValue({});
      mockPrismaService.postLike.count.mockResolvedValue(0);

      const res = await service.toggleLike('p-1', 'u-1');
      expect(res.success).toBe(true);
      expect(res.data.is_liked).toBe(false);
      expect(res.data.likes_count).toBe(0);
    });
  });
});
