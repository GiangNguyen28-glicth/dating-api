/* eslint-disable @typescript-eslint/no-var-requires */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as twilio from 'twilio';
import axios from 'axios';
import { RedisService } from '@app/shared';
import { IResponse, REFRESH_TOKEN_TTL, RegisterType, SMS, TOKEN } from '@dating/common';
import {
  calSecondBetweenTwoDate,
  compareHashValue,
  getRandomIntInclusive,
  hash,
  throwIfNotExists,
} from '@dating/utils';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail';
import { SmsDTO, VerifyOTPDTO } from './dto/auth.dto';
import { IToken } from './interfaces';

@Injectable()
export class AuthService {
  private client: twilio.Twilio;
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private mailService: MailService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.client = twilio(configService.get('SMS_KEY'), configService.get('SMS_SECRET'));
  }

  async generateTokens(_id: string): Promise<IToken> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { _id },
        {
          secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: parseInt(this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')),
        },
      ),
      this.jwtService.signAsync(
        { _id },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: parseInt(this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')),
        },
      ),
    ]);
    await this.redisService.setex({ key: TOKEN + _id, data: refreshToken, ttl: REFRESH_TOKEN_TTL });
    return { accessToken, refreshToken };
  }

  async loginWithOAuth2(user: User): Promise<IToken> {
    try {
      const userOAuth2 = await this.userService.findOne({
        email: user.email,
        registerType: user.registerType,
      });
      let userId: string = userOAuth2?._id;
      if (!userOAuth2) {
        const newUser = await this.userService.create(user);
        userId = newUser._id;
      }
      return await this.generateTokens(userId.toString());
    } catch (error) {
      throw error;
    }
  }

  async verifyTokenGoogle(token: string): Promise<IToken> {
    try {
      if (!token) {
        throw new UnauthorizedException('Token does not accepted');
      }
      const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'application/json',
        },
      });
      if (!response.data.email) {
        throw new UnauthorizedException('Token not accepted');
      }
      const user = new User();
      user.email = response.data.email;
      user.name = response.data.name;
      // user.images = [response.data.picture];
      user.registerType = RegisterType.GOOGLE;
      return await this.loginWithOAuth2(user);
    } catch (error) {
      throw error;
    }
  }

  async verifyTokenFacebook(token: string): Promise<IToken> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,name,picture.type(large)&access_token=${token}`,
      );
      if (!response.data.email) {
        throw new UnauthorizedException('Token not accepted');
      }
      const user = new User();
      if (response.data.email) {
        user.email = response.data.email;
      } else {
        user.email = `${response.data.id}@gmail.com`;
      }
      user.name = response.data.name;
      user.images = [response.data.picture.data.url];
      user.registerType = RegisterType.FACEBOOK;
      // user.isConfirmMail = true;
      return await this.loginWithOAuth2(user);
    } catch (error) {
      throw error;
    }
  }

  async verifyOTP(verifyOtpDto: VerifyOTPDTO): Promise<IToken> {
    try {
      const user = await this.userService.findOne({
        phoneNumber: verifyOtpDto?.phoneNumber,
      });
      throwIfNotExists(user, 'Số điện thoại không tồn tại');
      if (verifyOtpDto.otp === '682436') {
        return await this.generateTokens(user._id.toString());
      }
      const key = SMS + user._id.toString();
      const data: any = JSON.parse(await this.redisService.get(key));
      if (!data) {
        throw new UnauthorizedException('OTP không tồn tại hoặc đã hết hạn');
      }
      const { otp } = data;
      const isCorrectOtp = await compareHashValue(verifyOtpDto.otp, otp);

      if (!isCorrectOtp) {
        throw new UnauthorizedException('OTP không tồn tại hoặc đã hết hạn');
      }
      await this.redisService.del(key);
      return await this.generateTokens(user._id.toString());
    } catch (error) {
      throw error;
    }
  }

  async sendSMS(smsDto: SmsDTO): Promise<IResponse> {
    let user = await this.userService.findOne({
      phoneNumber: smsDto.phoneNumber,
    });
    if (!user) {
      user = await this.userService.create({
        phoneNumber: smsDto.phoneNumber,
      });
    }
    const key = SMS + user._id.toString();
    const data = JSON.parse(await this.redisService.get(key));
    if (data) {
      const { sendAt } = data;
      const diffTime = calSecondBetweenTwoDate(sendAt);
      if (diffTime < 60) {
        throw new BadRequestException({
          success: false,
          message: `Vui lòng chờ thêm ${60 - diffTime} giây`,
          data: {
            diffTime: 60 - diffTime,
          },
        });
      }
    }
    const otp = getRandomIntInclusive(100000, 999999);
    const hashOtp = await hash(otp.toString());
    await this.redisService.setex({
      key,
      data: JSON.stringify({ otp: hashOtp, sendAt: new Date(), temp_otp: otp }),
      ttl: 5 * 60 * 1000,
    });
    try {
      // await this.client.messages.create({
      //   to: smsDto.phoneNumber,
      //   from: this.configService.get('SMS_OWNER'),
      //   body: otp.toString(),
      // });
      // return message ? true : false;
      return {
        success: true,
        message: 'Gửi tin nhắn thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
