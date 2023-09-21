import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { MongooseConfigService, RabbitModule, RedisModule } from '@app/shared';
import { BillingModule } from '@modules/billing';
import { UsersModule } from '@modules/users';
import { MessageModule } from '@modules/message';
import { ActionModule } from '@modules/action';
import { SocketModule } from '@modules/socket';
import { MatchRequestModule } from '@modules/match-request';
import { NotificationModule } from '@modules/notification';

import { JobsModule } from './jobs';
import { RabbitConsumerModule } from './rabbit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/client-service/.env',
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    RedisModule,
    RabbitModule,
    RabbitConsumerModule,
    JobsModule,

    ActionModule,
    SocketModule,
    UsersModule,
    MessageModule,
    BillingModule,
    MatchRequestModule,
    NotificationModule,
  ],
})
export class ClientModule {}
