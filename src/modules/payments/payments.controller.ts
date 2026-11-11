import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmStripePaymentDto } from './dto/confirm-stripe-payment.dto';
import { SubmitWireProofDto } from './dto/submit-wire-proof.dto';
import { CreateCryptoDepositDto } from './dto/create-crypto-deposit.dto';
import { VerifyCryptoDepositDto } from './dto/verify-crypto-deposit.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'List all supported deposit & withdrawal payment methods',
  })
  @Get('methods')
  async getPaymentMethods() {
    const data = await this.paymentsService.getPaymentMethods();
    return {
      success: true,
      message: 'Payment methods retrieved successfully',
      data,
    };
  }

  @ApiOperation({
    summary: 'Create a Stripe Payment Intent for card deposits',
  })
  @Post('stripe/create-payment-intent')
  async createStripePaymentIntent(
    @Req() req: Request,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.paymentsService.createStripePaymentIntent(
      userId,
      dto,
    );
    return {
      success: true,
      message: 'Stripe payment intent created',
      data,
    };
  }

  @ApiOperation({
    summary: 'Confirm completed Stripe payment and credit user wallet',
  })
  @Post('stripe/confirm')
  async confirmStripePayment(
    @Req() req: Request,
    @Body() dto: ConfirmStripePaymentDto,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.paymentsService.confirmStripePayment(userId, dto);
    return {
      success: true,
      message: 'Deposit confirmed via Stripe and wallet credited',
      data,
    };
  }

  @ApiOperation({
    summary: 'Get platform bank wire transfer instructions',
  })
  @Get('bank/instructions')
  async getBankInstructions() {
    const data = await this.paymentsService.getBankInstructions();
    return {
      success: true,
      message: 'Bank transfer instructions retrieved',
      data,
    };
  }

  @ApiOperation({
    summary: 'Submit proof of bank wire transfer for verification',
  })
  @Post('bank/submit-wire-proof')
  async submitWireProof(@Req() req: Request, @Body() dto: SubmitWireProofDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.paymentsService.submitWireProof(userId, dto);
    return {
      success: true,
      message:
        'Bank wire deposit proof submitted successfully and queued for review',
      data,
    };
  }

  @ApiOperation({
    summary: 'Generate cryptocurrency deposit address and network QR details',
  })
  @Post('crypto/create-deposit-address')
  async createCryptoDepositAddress(
    @Req() req: Request,
    @Body() dto: CreateCryptoDepositDto,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.paymentsService.createCryptoDepositAddress(
      userId,
      dto,
    );
    return {
      success: true,
      message: 'Crypto deposit address generated successfully',
      data,
    };
  }

  @ApiOperation({
    summary: 'Verify cryptocurrency blockchain transaction and credit wallet',
  })
  @Post('crypto/verify-deposit')
  async verifyCryptoDeposit(
    @Req() req: Request,
    @Body() dto: VerifyCryptoDepositDto,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.paymentsService.verifyCryptoDeposit(userId, dto);
    return {
      success: true,
      message: 'Crypto transaction verified and wallet balance credited',
      data,
    };
  }
}
