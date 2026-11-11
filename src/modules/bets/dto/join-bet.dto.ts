import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Min,
} from 'class-validator';

export class JoinBetDto {
  @ApiProperty({
    example: 'OPPOSE',
    description: 'Bettor side: BACK or OPPOSE (for binary bets)',
    required: false,
    enum: ['BACK', 'OPPOSE'],
  })
  @IsOptional()
  @IsIn(['BACK', 'OPPOSE'])
  side?: 'BACK' | 'OPPOSE';

  @ApiProperty({
    example: 'out_cuid_123',
    description: 'Target outcome ID for custom multi-candidate bets',
    required: false,
  })
  @IsOptional()
  @IsString()
  outcome_id?: string;

  @ApiProperty({
    example: 50,
    description: 'Stake amount to place on this bet in dollars',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  stake: number;
}
