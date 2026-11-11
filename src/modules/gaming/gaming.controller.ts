import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GamingService } from './gaming.service';
import { SubmitGamingScoreDto } from './dto/submit-gaming-score.dto';

@ApiTags('gaming')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gaming')
export class GamingController {
  constructor(private readonly gamingService: GamingService) {}

  @ApiOperation({
    summary:
      'Submit player console match score and verification proof for 1v1 gaming wager',
  })
  @Post(':bet_id/submit-score')
  async submitScore(
    @Req() req: Request,
    @Param('bet_id') betId: string,
    @Body() dto: SubmitGamingScoreDto,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.gamingService.submitScore(userId, betId, dto);
    const msg =
      data.status === 'MATCHED'
        ? 'Both player scores matched! Match automatically resolved.'
        : data.status === 'MISMATCH'
          ? 'Score mismatch detected! Escalated to dispute resolution queue.'
          : 'Score recorded. Awaiting opponent score submission.';

    return {
      success: true,
      message: msg,
      data,
    };
  }

  @ApiOperation({
    summary:
      'Get dual-player console match status, submitted scores and dispute state',
  })
  @Get(':bet_id/match-check')
  async getMatchCheck(@Param('bet_id') betId: string) {
    const data = await this.gamingService.getMatchCheck(betId);
    return {
      success: true,
      message: 'Gaming match status retrieved',
      data,
    };
  }
}
