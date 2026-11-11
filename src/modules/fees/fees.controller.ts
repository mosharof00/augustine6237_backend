import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { FeesService } from './fees.service';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';

@ApiTags('fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @ApiOperation({ summary: 'Get current platform fee configuration' })
  @Get('config')
  async getFeeConfig() {
    return this.feesService.getFeeConfig();
  }

  @ApiOperation({ summary: 'Update platform fee configuration (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('config')
  async updateFeeConfig(@Req() req: Request, @Body() dto: UpdateFeeConfigDto) {
    const currentUserId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.feesService.updateFeeConfig(dto, currentUserId);
  }
}
