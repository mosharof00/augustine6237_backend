import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ControlPanelService } from './control-panel.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FeatureBetDto } from './dto/feature-bet.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class ControlPanelController {
  constructor(private readonly controlPanelService: ControlPanelService) {}

  @ApiOperation({
    summary: 'Get administrative macro statistics and liquidity overview',
  })
  @Get('overview')
  async getOverview() {
    const data = await this.controlPanelService.getOverview();
    return {
      success: true,
      message: 'Admin metrics overview retrieved',
      data,
    };
  }

  @ApiOperation({ summary: 'Get paginated user directory' })
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.controlPanelService.getUsers({
      search,
      status,
      page,
      limit,
    });
    return {
      success: true,
      message: 'User directory retrieved',
      data,
    };
  }

  @ApiOperation({ summary: 'Update user status (ACTIVE / SUSPENDED)' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const data = await this.controlPanelService.updateUserStatus(userId, dto);
    return {
      success: true,
      message: 'User status updated successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Toggle promotional / featured status for a bet' })
  @Post('bets/:id/feature')
  async featureBet(@Param('id') betId: string, @Body() dto: FeatureBetDto) {
    const data = await this.controlPanelService.featureBet(betId, dto);
    return {
      success: true,
      message: 'Bet promotional status updated',
      data,
    };
  }

  @ApiOperation({ summary: 'Get pending withdrawal requests' })
  @Get('withdrawals')
  async getPendingWithdrawals() {
    const data = await this.controlPanelService.getPendingWithdrawals();
    return {
      success: true,
      message: 'Pending withdrawals retrieved',
      data,
    };
  }

  @ApiOperation({ summary: 'Approve or reject a withdrawal request' })
  @Post('withdrawals/:id/review')
  async reviewWithdrawal(
    @Param('id') txId: string,
    @Body() dto: ReviewWithdrawalDto,
  ) {
    const data = await this.controlPanelService.reviewWithdrawal(txId, dto);
    return {
      success: true,
      message: 'Withdrawal request processed',
      data,
    };
  }
}
