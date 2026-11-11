import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Get personal profile posts for a user' })
  @Get('users/:id/posts')
  async getUserPosts(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.postsService.getUserPosts(id, currentUserId);
  }

  @ApiOperation({ summary: 'Create a personal profile post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts')
  async createPost(@Req() req: Request, @Body() dto: CreatePostDto) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.postsService.createPost(currentUserId, dto);
  }

  @ApiOperation({ summary: 'Delete a personal profile post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.postsService.deletePost(id, currentUserId);
  }

  @ApiOperation({ summary: 'Toggle like on a profile post' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  async toggleLike(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.postsService.toggleLike(id, currentUserId);
  }
}
