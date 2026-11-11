import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitGamingScoreDto {
  @ApiProperty({ description: 'Player own reported score', example: 3 })
  @IsInt()
  @Min(0)
  my_score: number;

  @ApiProperty({ description: 'Reported opponent score', example: 1 })
  @IsInt()
  @Min(0)
  opponent_score: number;

  @ApiPropertyOptional({
    description: 'Gaming platform (PLAYSTATION, XBOX, PC, NINTENDO)',
    example: 'PLAYSTATION',
  })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Player PSN Online ID or gamertag',
    example: 'Alex_PSN',
  })
  @IsString()
  @IsOptional()
  gamertag?: string;

  @ApiPropertyOptional({
    description: 'Proof screenshot or stream match clip URL',
    example: 'https://storage.betsocial.app/gaming/ps_match_123.jpg',
  })
  @IsString()
  @IsOptional()
  proof_url?: string;
}
