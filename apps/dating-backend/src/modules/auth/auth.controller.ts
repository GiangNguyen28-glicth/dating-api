import { GoogleGuard, IResponse } from '@dating/common';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SmsDTO, VerifyOTPDTO } from './dto';
import { IToken } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    return true;
  }

  @Get('/google/callback')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Req() req) {
    return this.authService.loginWithOAuth2(req);
  }

  @Get('google/verify')
  @ApiQuery({ name: 'token', type: 'string' })
  async verifyTokenGoogle(@Query() data): Promise<IToken> {
    const { token } = data;
    return await this.authService.verifyTokenGoogle(token);
  }

  @Get('facebook/verify')
  @ApiQuery({ name: 'token', type: 'string' })
  async verifyTokenFacebook(@Query() data): Promise<IToken> {
    const { token } = data;
    return await this.authService.verifyTokenFacebook(token);
  }

  @Post('verify-otp')
  @ApiBody({ type: VerifyOTPDTO })
  verifyOTP(@Body() verifyOTP: VerifyOTPDTO): Promise<IToken> {
    return this.authService.verifyOTP(verifyOTP);
  }

  @Post('send-sms')
  async sendSms(@Body() smsDto: SmsDTO): Promise<IResponse> {
    return await this.authService.sendSMS(smsDto);
  }
}
