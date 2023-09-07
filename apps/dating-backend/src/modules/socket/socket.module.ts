import { Global, Module, forwardRef } from '@nestjs/common';

import { WsStrategy } from '@common/strategies';
import { UsersModule } from '@modules/users';
import { MessageModule } from '@modules/message';

import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
@Global()
@Module({
  imports: [forwardRef(() => UsersModule), MessageModule],
  providers: [SocketGateway, SocketService, WsStrategy],
  exports: [SocketGateway],
})
export class SocketModule {}
