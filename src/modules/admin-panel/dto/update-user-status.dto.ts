import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Target account status',
    example: 'SUSPENDED',
    enum: ['ACTIVE', 'SUSPENDED'],
  })
  @IsNotEmpty()
  @IsString()
  status: 'ACTIVE' | 'SUSPENDED';

  @ApiPropertyOptional({
    description: 'Administrative moderation reason',
    example: 'Repeated score mismatch in console wagers',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
