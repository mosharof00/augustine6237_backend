import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { DepositWalletDto } from './dto/deposit-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({
    summary:
      'Get user wallet balance, escrow-locked funds, and cumulative stats',
  })
  @Get()
  async getWallet(@Req() req: Request) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.walletService.getWallet(userId);
  }

  @ApiOperation({ summary: 'Get user wallet transaction ledger history' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get('transactions')
  async getTransactions(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.walletService.getTransactions(userId, { type, status });
  }

  @ApiOperation({ summary: 'Deposit funds into wallet' })
  @Post('deposit')
  async deposit(@Req() req: Request, @Body() dto: DepositWalletDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.walletService.deposit(userId, dto);
  }

  @ApiOperation({ summary: 'Request withdrawal from wallet' })
  @Post('withdraw')
  async withdraw(@Req() req: Request, @Body() dto: WithdrawWalletDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    return this.walletService.withdraw(userId, dto);
  }
}
