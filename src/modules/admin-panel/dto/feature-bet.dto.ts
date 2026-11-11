import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class FeatureBetDto {
  @ApiProperty({
    description:
      'Whether the bet should be featured prominently on discovery feed',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_featured: boolean;
}
