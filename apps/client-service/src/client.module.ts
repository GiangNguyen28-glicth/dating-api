import { Module } from '@nestjs/common';
import { RabbitModule } from './rabbit/rabbit.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from '@app/shared';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/dating-backend/.env',
    }),
    RabbitModule,
    // UsersModule,
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
  ],
})
export class ClientModule {}
