import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class DepositWalletDto {
  @ApiProperty({ description: 'Deposit amount in USD', example: 100.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'CARD',
  })
  @IsString()
  @IsOptional()
  payment_method?: string;

  @ApiPropertyOptional({ description: 'Deposit description or notes' })
  @IsString()
  @IsOptional()
  description?: string;
}
