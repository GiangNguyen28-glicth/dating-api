import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisClientOptions } from 'redis';
import { HttpThrottlerGuard } from './common/guards';
import { ThrottlerConfigService } from './infra/configs';

import {
  CacheConfigService,
  MongooseConfigService,
  RabbitModule,
} from '@app/shared';
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TagModule } from '@modules/tag/tag.module';
import { MailModule } from '@modules/mail/mail.module';
import { SocketModule } from '@modules/socket/socket.module';
import { ConversationModule } from '@modules/conversation/conversation.module';
import { OfferingModule } from '@modules/offering/offering.module';
import { BillingModule } from '@modules/billing/billing.module';
import { MessageModule } from '@modules/message/message.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ActionModule } from '@modules/action/action.module';
import { ReportModule } from '@modules/report/report.module';
import { MatchRequestModule } from '@modules/match-request/match-request.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { RelationshipModule } from '@modules/relationship/relationship.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/dating-backend/.env',
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useClass: CacheConfigService,
    }),
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
