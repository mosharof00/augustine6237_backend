import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewKycDto {
  @ApiProperty({ description: 'User ID to review', example: 'u_bettor_1' })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Updated KYC status',
    enum: ['VERIFIED', 'REJECTED'],
    example: 'VERIFIED',
  })
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Rejection reason if status is REJECTED',
    example: 'Document expired or blurred scan',
  })
  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
