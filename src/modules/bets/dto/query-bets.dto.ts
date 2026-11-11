import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryBetsDto {
  @ApiProperty({
    example: 'SPORTS',
    description:
      'Filter by category (SPORTS, POLITICS, PUBLIC_ISSUES, CRYPTO, or ALL)',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Filter by status (ACTIVE, MATCHED, RESOLVED, or ALL)',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: 'trending',
    description: 'Sort mode: trending, ending_soon, or newest',
    required: false,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({
    example: 'Arsenal',
    description: 'Search string for title or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'GB',
    description: 'Filter by country code (US, GB, NG, CA, or GLOBAL)',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: 'true',
    description: 'Filter by promotional featured status',
    required: false,
  })
  @IsOptional()
  is_featured?: any;
}
