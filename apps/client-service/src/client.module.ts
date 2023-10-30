import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MongooseConfigService, RabbitModule, RedisModule } from '@app/shared';

import { MailModule } from '@modules/mail';
import { ImageModule } from './images/image.module';
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
    ImageModule,

    MailModule,
  ],
})
export class ClientModule {}
