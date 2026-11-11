import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { BetsService } from './bets.service';
import { CreateBetCommentDto } from './dto/create-bet-comment.dto';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetsDto } from './dto/query-bets.dto';
import { JoinBetDto } from './dto/join-bet.dto';
import { PlaceStakeDto } from './dto/place-stake.dto';
import { ResolveBetDto } from './dto/resolve-bet.dto';

@ApiTags('bets')
@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @ApiOperation({ summary: 'List public bets with filters and sorting' })
  @Get()
  async getPublicBets(@Query() query: QueryBetsDto) {
    return this.betsService.getPublicBets(query);
  }

  @ApiOperation({
    summary:
      'Filter discovery feed by country, trending rank, and promotional featured status',
  })
  @Get('explore')
  async exploreBets(@Query() query: QueryBetsDto) {
    return this.betsService.exploreBets(query);
  }

  @ApiOperation({
    summary: 'List trending topic tags and market activity volumes',
  })
  @Get('trending-topics')
  async getTrendingTopics() {
    return this.betsService.getTrendingTopics();
  }

  @ApiOperation({
    summary: 'List supported discovery countries with bet counts',
  })
  @Get('countries')
  async getSupportedCountries() {
    return this.betsService.getSupportedCountries();
  }

  @ApiOperation({ summary: 'Resolve bet by shareable invite code' })
  @Get('invite/:code')
  async getBetByInviteCode(@Param('code') code: string) {
    return this.betsService.getBetByInviteCode(code);
  }

  @ApiOperation({ summary: 'Join bet by invite code with a stake' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('invite/:code/join')
  async joinBetByInviteCode(
    @Param('code') code: string,
    @Req() req: Request,
    @Body() dto: JoinBetDto,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.joinBetByInviteCode(code, currentUserId, dto);
  }

  @ApiOperation({ summary: 'Get participants for a bet' })
  @Get(':id/participants')
  async getBetParticipants(@Param('id') id: string) {
    return this.betsService.getBetParticipants(id);
  }

  @ApiOperation({ summary: 'Get outcomes and percentages for a bet' })
  @Get(':id/outcomes')
  async getBetOutcomes(@Param('id') id: string) {
    return this.betsService.getBetOutcomes(id);
  }

  @ApiOperation({
    summary: 'Get matched vs unmatched pool breakdown and live odds',
  })
  @Get(':id/matched-status')
  async getMatchedStatus(@Param('id') id: string) {
    return this.betsService.getMatchedStatus(id);
  }

  @ApiOperation({ summary: 'Refund all unmatched stakes for a bet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/refund-unmatched')
  async refundUnmatchedStakes(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.refundUnmatchedStakes(id, currentUserId);
  }

  @ApiOperation({
    summary: 'Get escrow pool status and proportional payout distribution',
  })
  @Get(':id/escrow')
  async getEscrowStatus(@Param('id') id: string) {
    return this.betsService.getEscrowStatus(id);
  }

  @ApiOperation({
    summary: 'Get bet platform commission details and deductions roster',
  })
  @Get(':id/commission')
  async getBetCommission(@Param('id') id: string) {
    return this.betsService.getBetCommission(id);
  }

  @ApiOperation({
    summary: 'Resolve bet, declare winner, and distribute escrow payouts',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/resolve')
  async resolveBet(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ResolveBetDto,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.resolveBet(id, dto, currentUserId);
  }

  @ApiOperation({ summary: 'Place a stake on an outcome or side' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/stake')
  async placeStake(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: PlaceStakeDto,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.placeStake(id, currentUserId, dto);
  }

  @ApiOperation({ summary: 'Get single bet details' })
  @Get(':id')
  async getBetById(@Param('id') id: string) {
    return this.betsService.getBetById(id);
  }

  @ApiOperation({ summary: 'Create a new public bet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async createBet(@Req() req: Request, @Body() dto: CreateBetDto) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.createBet(currentUserId, dto);
  }

  @ApiOperation({ summary: 'Get discussion comments for a bet' })
  @Get(':id/comments')
  async getBetComments(@Param('id') id: string) {
    return this.betsService.getBetComments(id);
  }

  @ApiOperation({ summary: 'Post a comment/chat message in a bet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createBetComment(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: CreateBetCommentDto,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.createBetComment(id, currentUserId, dto);
  }

  @ApiOperation({ summary: 'Delete own comment from a bet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':betId/comments/:commentId')
  async deleteBetComment(
    @Param('betId') betId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.betsService.deleteBetComment(betId, commentId, currentUserId);
  }
}
