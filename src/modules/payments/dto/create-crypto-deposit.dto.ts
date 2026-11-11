import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCryptoDepositDto {
  @ApiProperty({
    description: 'Cryptocurrency asset symbol (e.g. USDT, USDC, BTC, ETH)',
    example: 'USDT',
  })
  @IsString()
  @IsNotEmpty()
  cryptocurrency: string;

  @ApiProperty({
    description: 'Blockchain network (e.g. POLYGON, ETHEREUM, TRON, BITCOIN)',
    example: 'POLYGON',
  })
  @IsString()
  @IsNotEmpty()
  network: string;
}
