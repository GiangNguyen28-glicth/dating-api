import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersConsumer } from './users.consumer';
import { RabbitModule } from '../../rabbit';

@Module({
  imports: [RabbitModule],
  providers: [UsersService, UsersConsumer],
})
export class UsersModule {}
