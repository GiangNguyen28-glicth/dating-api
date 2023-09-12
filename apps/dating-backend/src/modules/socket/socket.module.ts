import { Global, Module, forwardRef } from '@nestjs/common';

import { WsStrategy } from '@common/strategies';
import { ActionModule, MessageModule, UsersModule } from '@dating/modules';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
@Global()
@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ActionModule),
    MessageModule,
  ],
  providers: [SocketGateway, SocketService, WsStrategy],
  exports: [SocketGateway],
})
export class SocketModule {}
