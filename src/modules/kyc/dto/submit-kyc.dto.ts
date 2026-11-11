import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({
    description: 'Document type (PASSPORT, DRIVERS_LICENSE, NATIONAL_ID)',
    example: 'PASSPORT',
  })
  @IsString()
  @IsNotEmpty()
  document_type: string;

  @ApiProperty({
    description: 'Government document identification number',
    example: 'P12345678',
  })
  @IsString()
  @IsNotEmpty()
  document_number: string;

  @ApiProperty({
    description: 'URL of uploaded document scan / photo',
    example: 'https://storage.betsocial.app/kyc/doc_passport_123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  document_url: string;

  @ApiPropertyOptional({
    description: 'Full legal name',
    example: 'Alex Mercer',
  })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Country of residence',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1994-08-15',
  })
  @IsString()
  @IsOptional()
  date_of_birth?: string;
}
