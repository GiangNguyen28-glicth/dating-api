import { Global, Module } from '@nestjs/common';

import { WsStrategy } from '@common/strategies';
import { MessageModule } from '@modules/message';

import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
@Global()
@Module({
  imports: [MessageModule],
  controllers: [SocketController],
  providers: [SocketService, SocketGateway, WsStrategy],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
