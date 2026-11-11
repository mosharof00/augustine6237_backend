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
import { AiService } from './ai.service';
import { ResearchBetDto } from './dto/research-bet.dto';
import { AiChatDto } from './dto/ai-chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({
    summary:
      'Generate AI contextual research, sentiment and betting intelligence for a bet',
  })
  @Post('research-bet')
  async researchBet(@Req() req: Request, @Body() dto: ResearchBetDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.aiService.researchBet(userId, dto);
    return {
      success: true,
      message: 'AI bet research analysis completed',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Interactive chat with AI Research Assistant regarding market context and strategies',
  })
  @Post('chat')
  async chat(@Req() req: Request, @Body() dto: AiChatDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.aiService.chat(userId, dto);
    return {
      success: true,
      message: 'AI assistant response generated',
      data,
    };
  }

  @ApiOperation({
    summary: 'Retrieve pre-analyzed AI insights for a target bet',
  })
  @Get('bet-insights/:bet_id')
  async getBetInsights(@Param('bet_id') betId: string) {
    const data = await this.aiService.getBetInsights(betId);
    return {
      success: true,
      message: 'AI insights retrieved',
      data,
    };
  }
}
