import { CacheModule, Module } from '@nestjs/common';
import { RabbitModule } from './rabbit/rabbit.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheConfigService, MongooseConfigService } from '@app/shared';
import { ConfigModule } from '@nestjs/config';
import { RedisClientOptions } from 'redis';

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
    RabbitModule,
    UsersModule,
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
  ],
})
export class ClientModule {}
