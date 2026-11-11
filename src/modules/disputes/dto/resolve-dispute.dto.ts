import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({
    description:
      'Adjudication outcome (UPHOLD_ORIGINAL, OVERTURN_RESULT, REFUND_ALL)',
    enum: ['UPHOLD_ORIGINAL', 'OVERTURN_RESULT', 'REFUND_ALL'],
    example: 'OVERTURN_RESULT',
  })
  @IsIn(['UPHOLD_ORIGINAL', 'OVERTURN_RESULT', 'REFUND_ALL'])
  resolution: 'UPHOLD_ORIGINAL' | 'OVERTURN_RESULT' | 'REFUND_ALL';

  @ApiProperty({
    description: 'Arbitration explanation and notes',
    example: 'Official match footage confirms Arsenal goal. Result overturned.',
  })
  @IsString()
  @IsNotEmpty()
  resolution_notes: string;

  @ApiPropertyOptional({
    description: 'New winning side if result is overturned (BACK or OPPOSE)',
    example: 'BACK',
  })
  @IsString()
  @IsOptional()
  new_winning_side?: string;

  @ApiPropertyOptional({
    description: 'New winning outcome ID for multi-outcome bets',
    example: 'out_cuid_1',
  })
  @IsString()
  @IsOptional()
  new_winning_outcome_id?: string;
}
