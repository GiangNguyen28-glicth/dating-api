import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisClientOptions } from 'redis';
import { HttpThrottlerGuard } from './common/guards';
import {
  CacheConfigService,
  RabbitModule,
  ThrottlerConfigService,
} from './infra/configs';
import {
  ActionModule,
  AuthModule,
  BillingModule,
  ConversationModule,
  MailModule,
  MatchRequestModule,
  MessageModule,
  OfferingModule,
  PaymentModule,
  RelationshipModule,
  ReportModule,
  SocketModule,
  TagModule,
  UsersModule,
} from './modules';
import { MongooseConfigService } from '@app/shared';

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class AppModule {}
