import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ description: 'Bet ID being disputed', example: 'bet_cuid123' })
  @IsString()
  @IsNotEmpty()
  bet_id: string;

  @ApiProperty({
    description:
      'Dispute reason (INCORRECT_RESULT, EVENT_CANCELLED, COLLUSION, SCORE_MISMATCH)',
    example: 'INCORRECT_RESULT',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Detailed explanation and evidence description',
    example:
      'Official match referee report confirms Arsenal scored in the 94th minute.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'URL of uploaded proof document or screenshot',
    example: 'https://storage.betsocial.app/evidence/referee_report_94.pdf',
  })
  @IsString()
  @IsOptional()
  evidence_url?: string;
}
