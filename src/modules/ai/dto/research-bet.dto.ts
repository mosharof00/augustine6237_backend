import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResearchBetDto {
  @ApiProperty({
    description: 'ID of the bet to research',
    example: 'bet_cuid123',
  })
  @IsNotEmpty()
  @IsString()
  bet_id: string;

  @ApiPropertyOptional({
    description: 'Specific angle or query to research about the bet',
    example: 'Analyze form, key injuries, and historical head-to-head',
  })
  @IsOptional()
  @IsString()
  prompt?: string;
}
