import { ApiProperty } from '@nestjs/swagger';

export class CardNumberDTO {
  @ApiProperty({ default: '4242424242424242' })
  number: string;

  @ApiProperty({ default: 10 })
  exp_month: number;

  @ApiProperty({ default: 2050 })
  exp_year: number;

  @ApiProperty({ default: '123' })
  cvc: string;
}

export class CheckoutDTO {
  @ApiProperty()
  cardNumber: CardNumberDTO;

  @ApiProperty({ default: 'Giang Nguyen' })
  holderName: string;

  @ApiProperty({ default: '123' })
  postalCode: string;

  @ApiProperty()
  offeringId: string;

  @ApiProperty()
  packageId: string;
}
