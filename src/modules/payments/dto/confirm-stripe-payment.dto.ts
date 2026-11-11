import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmStripePaymentDto {
  @ApiProperty({
    description: 'Stripe Payment Intent ID',
    example: 'pi_3N42abcXYZ9876',
  })
  @IsString()
  @IsNotEmpty()
  payment_intent_id: string;
}
