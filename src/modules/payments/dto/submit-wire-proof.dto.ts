import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SubmitWireProofDto {
  @ApiProperty({ description: 'Wire transfer amount', example: 500.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Sender bank name', example: 'Wells Fargo' })
  @IsString()
  @IsNotEmpty()
  sender_bank: string;

  @ApiProperty({
    description: 'Wire reference or tracking code',
    example: 'BS-DEPOSIT-98213',
  })
  @IsString()
  @IsNotEmpty()
  reference_number: string;

  @ApiPropertyOptional({
    description: 'Proof document/receipt URL',
    example: 'https://storage.betsocial.app/proofs/wire_98213.pdf',
  })
  @IsString()
  @IsOptional()
  proof_url?: string;

  @ApiPropertyOptional({ description: 'Additional transfer notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
