import { Global, Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { WsStrategy } from '@common/strategies/ws.strategies';
import { UsersModule } from '@modules/users';
import { MessageModule } from '@modules/message';
@Global()
@Module({
  imports: [forwardRef(() => UsersModule), MessageModule],
  providers: [SocketGateway, SocketService, WsStrategy],
  exports: [SocketGateway],
})
export class SocketModule {}
