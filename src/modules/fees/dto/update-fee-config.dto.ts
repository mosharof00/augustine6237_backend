import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateFeeConfigDto {
  @ApiProperty({
    example: 8.5,
    description: 'Platform commission percentage (0.0 to 30.0)',
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  commission_rate: number;

  @ApiProperty({
    example: 'Promotional reduced platform fee',
    description: 'Description of fee policy',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
