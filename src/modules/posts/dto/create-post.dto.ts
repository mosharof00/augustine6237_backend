import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Watching the Champions League final! Locked my bet on Arsenal.',
    description: 'Caption text for the post',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    example: 'https://storage.betsocial.com/posts/arsenal.jpg',
    description: 'Image URL for the profile post photo',
    required: false,
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({
    example: 'London, UK',
    description: 'Optional location tag',
    required: false,
  })
  @IsOptional()
  @IsString()
  location_tag?: string;
}
