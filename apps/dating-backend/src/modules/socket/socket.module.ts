import { Global, Module } from '@nestjs/common';

import { WsStrategy } from '@common/strategies';
import { MessageModule } from '@modules/message';

import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
@Global()
@Module({
  imports: [MessageModule],
  providers: [SocketGateway, SocketService, WsStrategy],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
