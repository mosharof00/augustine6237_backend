import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateBetDto {
  @ApiProperty({
    example: 'Arsenal to beat Chelsea in Premier League Derby',
    description: 'Title of the betting prediction / event',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Full-time match outcome in regulation 90 mins.',
    description: 'Detailed conditions or rules of the bet',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'SPORTS',
    description: 'Category: SPORTS, POLITICS, PUBLIC_ISSUES, CRYPTO, GAMING',
    required: false,
    default: 'SPORTS',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: '2026-11-12T19:00:00Z',
    description: 'Countdown deadline for bet participation (ISO string)',
  })
  @IsNotEmpty()
  @IsDateString()
  deadline: string;

  @ApiProperty({
    example: 100,
    description: 'Initial stake amount in dollars',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  initial_stake?: number;

  @ApiProperty({
    example: false,
    description: 'Whether this bet is private (invite only)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @ApiProperty({
    example: 'BINARY',
    description:
      'Bet type: BINARY (YES/NO) or CUSTOM (Multi-outcome selection)',
    required: false,
    default: 'BINARY',
  })
  @IsOptional()
  @IsIn(['BINARY', 'CUSTOM'])
  bet_type?: 'BINARY' | 'CUSTOM';

  @ApiProperty({
    example: ['Arsenal', 'Manchester City', 'Liverpool', 'Chelsea'],
    description: 'Custom outcomes (required if bet_type is CUSTOM)',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  outcomes?: string[];

  @ApiProperty({
    example: 'Arsenal',
    description: 'Target outcome candidate for initial stake in a CUSTOM bet',
    required: false,
  })
  @IsOptional()
  @IsString()
  initial_outcome?: string;

  @ApiProperty({
    example: 'GB',
    description: 'Country or region code (e.g. US, GB, NG, CA, or GLOBAL)',
    required: false,
    default: 'GLOBAL',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: 'BACK',
    description: 'Initial position side: BACK or OPPOSE',
    required: false,
    default: 'BACK',
  })
  @IsOptional()
  @IsIn(['BACK', 'OPPOSE'])
  initial_side?: 'BACK' | 'OPPOSE';
}
