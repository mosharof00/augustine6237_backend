import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('users')
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Get user profile with stats and social graph' })
  @Get(':id/profile')
  async getProfile(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.profileService.getProfile(id, currentUserId);
  }

  @ApiOperation({ summary: 'Toggle follow / unfollow on a user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async toggleFollow(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.profileService.toggleFollow(id, currentUserId);
  }

  @ApiOperation({ summary: 'Get reviews for a user' })
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.profileService.getReviews(id);
  }

  @ApiOperation({ summary: 'Submit a review for a user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: CreateReviewDto,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.profileService.createReview(id, currentUserId, dto);
  }
}
