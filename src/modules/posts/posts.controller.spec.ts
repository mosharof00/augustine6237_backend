import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;

  const mockPostsService = {
    getUserPosts: jest.fn(),
    createPost: jest.fn(),
    deletePost: jest.fn(),
    toggleLike: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getUserPosts', async () => {
    mockPostsService.getUserPosts.mockResolvedValue({
      success: true,
      data: [],
    });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.getUserPosts('u2', req);
    expect(res.success).toBe(true);
    expect(mockPostsService.getUserPosts).toHaveBeenCalledWith('u2', 'u1');
  });

  it('should call createPost', async () => {
    const dto = { caption: 'Test Post', image_url: 'http://img.jpg' };
    mockPostsService.createPost.mockResolvedValue({
      success: true,
      data: { id: 'p1' },
    });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.createPost(req, dto);
    expect(res.success).toBe(true);
    expect(mockPostsService.createPost).toHaveBeenCalledWith('u1', dto);
  });

  it('should call deletePost', async () => {
    mockPostsService.deletePost.mockResolvedValue({ success: true });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.deletePost('p1', req);
    expect(res.success).toBe(true);
    expect(mockPostsService.deletePost).toHaveBeenCalledWith('p1', 'u1');
  });

  it('should call toggleLike', async () => {
    mockPostsService.toggleLike.mockResolvedValue({
      success: true,
      data: { is_liked: true, likes_count: 5 },
    });
    const req = { user: { userId: 'u1' } } as any;

    const res = await controller.toggleLike('p1', req);
    expect(res.data.is_liked).toBe(true);
    expect(mockPostsService.toggleLike).toHaveBeenCalledWith('p1', 'u1');
  });
});
