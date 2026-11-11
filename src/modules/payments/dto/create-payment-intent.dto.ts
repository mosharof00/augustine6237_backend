import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Deposit amount', example: 100.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}
