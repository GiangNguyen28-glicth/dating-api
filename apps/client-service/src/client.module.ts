import { MongooseConfigService, RabbitModule, RedisModule } from '@app/shared';
import { BillingModule } from '@modules/billing';
import { UsersModule } from '@modules/users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsModule } from './jobs';
import { RabbitConsumerModule } from './rabbit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/client-service/.env',
    }),
    RedisModule,
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
