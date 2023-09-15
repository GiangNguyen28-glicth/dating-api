import { BadRequestException, CACHE_MANAGER, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  transporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USERNAME'),
        pass: this.configService.get('EMAIL_PASSWORD'), // naturally, replace both with your real credentials or an application-specific password
      },
    });
  }
  async sendMail(email: string, subject: string, html: string): Promise<SMTPTransport.SentMessageInfo> {
    return await this.transporter().sendMail({
      from: this.configService.get('EMAIL_USERNAME'),
      to: email,
      subject: subject,
      html: html,
    });
  }

  async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_VERIFICATION_EMAIL_TOKEN_SECRET,
      });
      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException("Can't decode this token");
    } catch (error) {
      throw error;
    }
  }

  //   async confirmEmail(email: string, code: number): Promise<boolean> {
  //     const [user, cacheValue] = await Promise.all([
  //       this.userService.getOne({ email }),
  //       this.cacheManager.get(`${Constants.VERIFY_ACCOUNT_CODE}_${email}`),
  //     ]);
  //     if (!user) {
  //       throw new UnauthorizedException("This token can't use with email");
  //     }
  //     if (user.isConfirmMail) {
  //       throw new BadRequestException('Email đã được xác thực');
  //     }
  //     if (cacheValue !== code) {
  //       throw new BadRequestException('Code hiện tại không còn khả dụng !');
  //     }
  //     await Promise.all([
  //       this.userService.findOneAndUpdate(
  //         { email },
  //         { $set: { isConfirmMail: true } },
  //       ),
  //       this.cacheManager.del(`${Constants.VERIFY_ACCOUNT_CODE}_${email}`),
  //     ]);
  //     return true;
  //   }
}
