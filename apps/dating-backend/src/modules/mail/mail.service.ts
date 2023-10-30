import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ISendMail } from './interfaces';

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
  async sendMail(payload: ISendMail): Promise<SMTPTransport.SentMessageInfo> {
    payload.from = this.configService.get('EMAIL_USERNAME');
    return await this.transporter().sendMail(payload);
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
}
