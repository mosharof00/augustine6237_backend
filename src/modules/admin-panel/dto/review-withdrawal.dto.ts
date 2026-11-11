import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewWithdrawalDto {
  @ApiProperty({
    description: 'Administrative decision on withdrawal request',
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsNotEmpty()
  @IsString()
  action: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Internal audit notes or gateway reference number',
    example: 'Bank wire confirmation ref #WIRE-2026-881',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
