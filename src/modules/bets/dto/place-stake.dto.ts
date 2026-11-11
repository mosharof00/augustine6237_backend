import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Min,
} from 'class-validator';

export class PlaceStakeDto {
  @ApiProperty({
    example: 'out_cuid_123',
    description: 'Target outcome ID for custom multi-candidate bets',
    required: false,
  })
  @IsOptional()
  @IsString()
  outcome_id?: string;

  @ApiProperty({
    example: 'BACK',
    description: 'Position side for binary YES/NO bets: BACK or OPPOSE',
    required: false,
    enum: ['BACK', 'OPPOSE'],
  })
  @IsOptional()
  @IsIn(['BACK', 'OPPOSE'])
  side?: 'BACK' | 'OPPOSE';

  @ApiProperty({
    example: 100,
    description: 'Stake amount in dollars',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  stake: number;
}
