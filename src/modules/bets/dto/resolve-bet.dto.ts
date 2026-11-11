import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ResolveBetDto {
  @ApiProperty({
    example: 'BACK',
    description: 'Winning side for binary YES/NO bets: BACK or OPPOSE',
    required: false,
    enum: ['BACK', 'OPPOSE'],
  })
  @IsOptional()
  @IsIn(['BACK', 'OPPOSE'])
  winning_side?: 'BACK' | 'OPPOSE';

  @ApiProperty({
    example: 'out_cuid_123',
    description: 'Winning outcome ID for custom multi-candidate bets',
    required: false,
  })
  @IsOptional()
  @IsString()
  winning_outcome_id?: string;
}
