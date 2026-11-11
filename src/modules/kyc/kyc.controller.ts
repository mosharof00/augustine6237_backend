import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({
    summary: 'Get current user KYC verification status & limits',
  })
  @Get('status')
  async getKycStatus(@Req() req: Request) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.kycService.getKycStatus(userId);
    return {
      success: true,
      message: 'KYC status retrieved successfully',
      data,
    };
  }

  @ApiOperation({
    summary: 'Submit government ID document for KYC compliance review',
  })
  @Post('submit')
  async submitKyc(@Req() req: Request, @Body() dto: SubmitKycDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.kycService.submitKyc(userId, dto);
    return {
      success: true,
      message:
        'KYC verification documents submitted successfully and queued for review',
      data,
    };
  }

  @ApiOperation({
    summary: 'Admin review to approve or reject KYC submission',
  })
  @Post('admin/review')
  async reviewKyc(@Req() req: Request, @Body() dto: ReviewKycDto) {
    const reviewerId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.kycService.reviewKyc(reviewerId, dto);
    return {
      success: true,
      message: 'KYC verification reviewed successfully',
      data,
    };
  }
}
