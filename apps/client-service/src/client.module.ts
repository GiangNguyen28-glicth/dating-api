import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CacheConfigService,
  MongooseConfigService,
  RabbitModule,
} from '@app/shared';
import { ConfigModule } from '@nestjs/config';
import { RedisClientOptions } from 'redis';
import { BillingModule } from '@modules/billing';
import { UsersModule } from '@modules/users';
import { RabbitConsumerModule } from './rabbit';
import { JobsModule } from './jobs';

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
    RabbitModule,
    RabbitConsumerModule,
    JobsModule,
    UsersModule,
    BillingModule,
  ],
})
export class ClientModule {}
