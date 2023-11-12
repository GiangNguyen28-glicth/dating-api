import { Admin } from '@modules/admin/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SmsDTO {
  @ApiProperty()
  @IsNotEmpty()
  // @Matches(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/, {
  //   message: 'Cung cấp đúng format số điện thoại với format +84',
  // })
  phoneNumber: string;
}

export class AdminAuthDTO implements Partial<Admin> {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class VerifyOTPDTO {
  @ApiProperty()
  @IsNotEmpty()
  // @Matches(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  otp: string;
}
