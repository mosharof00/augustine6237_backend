import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBetCommentDto {
  @ApiProperty({
    example: 'Arsenal defense is rock solid today, backing 2-0!',
    description: 'Comment content / message text',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    example: 'BACK',
    description: 'Bettor stance: BACK, OPPOSE, or SPECTATOR',
    required: false,
    default: 'SPECTATOR',
  })
  @IsOptional()
  @IsString()
  stance?: string;
}
