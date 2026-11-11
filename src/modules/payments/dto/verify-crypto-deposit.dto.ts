import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class VerifyCryptoDepositDto {
  @ApiProperty({
    description: 'Blockchain transaction hash',
    example: '0x98fe142bcda9871101fa23',
  })
  @IsString()
  @IsNotEmpty()
  tx_hash: string;

  @ApiProperty({ description: 'Cryptocurrency asset symbol', example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  cryptocurrency: string;

  @ApiProperty({ description: 'Blockchain network', example: 'POLYGON' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ description: 'Deposit amount', example: 200.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}
