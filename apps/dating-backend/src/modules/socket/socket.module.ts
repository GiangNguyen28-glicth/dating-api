import { Global, Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { WsStrategy } from '@common/strategies/ws.strategies';
import { UsersModule } from '@modules/users';
import { MessageModule } from '@modules/message';
import { ClientsModule, Transport } from '@nestjs/microservices';
@Global()
@Module({
  imports: [
    forwardRef(() => UsersModule),
    MessageModule,
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  providers: [SocketGateway, SocketService, WsStrategy],
  exports: [SocketGateway],
})
export class SocketModule {}
