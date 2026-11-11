import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    userFollow: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userReview: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user profile with stats and social graph', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({
      id: 'user-1',
      name: 'Alex Mercer',
      username: 'alexm',
      avatar: null,
      bio: 'Sports bettor',
      location: 'London',
      type: 'CLIENT',
      balance: '350.00',
      wins: 10,
      losses: 5,
    });
    mockPrismaService.userFollow.count.mockResolvedValueOnce(25); // followers
    mockPrismaService.userFollow.count.mockResolvedValueOnce(12); // following
    mockPrismaService.userFollow.findUnique.mockResolvedValue(null);
    mockPrismaService.userReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.8 },
      _count: { rating: 15 },
    });

    const result = await service.getProfile('user-1', 'user-2');
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Alex Mercer');
    expect(result.data.followers_count).toBe(25);
    expect(result.data.stats.wins).toBe(10);
    expect(result.data.stats.losses).toBe(5);
    expect(result.data.stats.total_bets).toBe(15);
    expect(result.data.stats.win_rate).toBe(66.7);
    expect(result.data.rating.average).toBe(4.8);
  });

  it('should toggle follow status', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({ id: 'target-user' });
    mockPrismaService.userFollow.findUnique.mockResolvedValue(null); // not following
    mockPrismaService.userFollow.create.mockResolvedValue({ id: 'f-1' });
    mockPrismaService.userFollow.count.mockResolvedValue(1);

    const result = await service.toggleFollow('target-user', 'current-user');
    expect(result.success).toBe(true);
    expect(result.data.is_following).toBe(true);
    expect(result.data.followers_count).toBe(1);
  });

  it('should create and return review', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue({ id: 'target-user' });
    mockPrismaService.userReview.create.mockResolvedValue({
      id: 'rev-1',
      rating: 5,
      comment: 'Great bettor!',
    });

    const result = await service.createReview('target-user', 'author-user', {
      rating: 5,
      comment: 'Great bettor!',
    });
    expect(result.success).toBe(true);
    expect(result.data.rating).toBe(5);
  });
});
