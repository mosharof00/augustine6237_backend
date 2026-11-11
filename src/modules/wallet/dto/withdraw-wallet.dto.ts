import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class WithdrawWalletDto {
  @ApiProperty({ description: 'Withdrawal amount in USD', example: 50.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description: 'Payout method',
    example: 'BANK_TRANSFER',
  })
  @IsString()
  @IsOptional()
  payout_method?: string;

  @ApiPropertyOptional({
    description: 'Destination details (account / wallet address)',
    example: 'IBAN GB82WEST12345698765432',
  })
  @IsString()
  @IsOptional()
  destination_details?: string;
}
