import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    getProfile: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'user-1', name: 'Alex Mercer', followers_count: 10 },
    }),
    toggleFollow: jest.fn().mockResolvedValue({
      success: true,
      message: 'Followed successfully',
      data: { is_following: true, followers_count: 11 },
    }),
    getReviews: jest.fn().mockResolvedValue({
      success: true,
      data: [{ id: 'rev-1', rating: 5 }],
    }),
    createReview: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'rev-1', rating: 5 },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get profile', async () => {
    const res = await controller.getProfile('user-1', {
      user: { userId: 'curr-1' },
    } as any);
    expect(res.success).toBe(true);
    expect(res.data.name).toBe('Alex Mercer');
  });

  it('should toggle follow', async () => {
    const res = await controller.toggleFollow('user-1', {
      user: { userId: 'curr-1' },
    } as any);
    expect(res.success).toBe(true);
    expect(res.data.is_following).toBe(true);
  });

  it('should get reviews', async () => {
    const res = await controller.getReviews('user-1');
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it('should create review', async () => {
    const res = await controller.createReview(
      'user-1',
      { user: { userId: 'curr-1' } } as any,
      { rating: 5, comment: 'Nice' },
    );
    expect(res.success).toBe(true);
  });
});
