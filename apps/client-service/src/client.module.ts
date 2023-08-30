import { CacheModule, Module } from '@nestjs/common';
import { RabbitModule } from './rabbit/rabbit.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheConfigService, MongooseConfigService } from '@app/shared';
import { ConfigModule } from '@nestjs/config';
import { RedisClientOptions } from 'redis';
import { BillingModule } from '@modules/billing';
import { UsersModule } from '@modules/users';

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
    UsersModule,
    // BillingModule,
  ],
})
export class ClientModule {}
