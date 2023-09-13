import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { MongooseConfigService, RabbitModule, RedisModule } from '@app/shared';
import { HttpThrottlerGuard } from './common/guards';
import { ThrottlerConfigService } from './infra/configs';
import {
  ActionModule,
  AuthModule,
  BillingModule,
  ConversationModule,
  MailModule,
  MatchRequestModule,
  MessageModule,
  NotificationModule,
  OfferingModule,
  PaymentModule,
  RelationshipModule,
  ReportModule,
  SocketModule,
  TagModule,
  UsersModule,
} from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/dating-backend/.env',
    }),
    RedisModule,
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    ThrottlerModule.forRootAsync({
      useClass: ThrottlerConfigService,
    }),
    RabbitModule,
    UsersModule,
    AuthModule,
    TagModule,
    MailModule,
    SocketModule,
    ConversationModule,
    OfferingModule,
    MessageModule,
    BillingModule,
    PaymentModule,
    ActionModule,
    ReportModule,
    MatchRequestModule,
    RelationshipModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class AppModule {}
