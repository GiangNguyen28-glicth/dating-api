import {
  CurrentUserWS,
  ISocketIdsClient,
  SOCKET,
  WebsocketExceptionsFilter,
  WsGuard,
} from '@dating/common';
import { CreateMessageDto } from '@modules/message/dto';
import { MessageService } from '@modules/message/message.service';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';
import {
  Inject,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
  forwardRef,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { Message } from '@modules/message/entities';

@WebSocketGateway(80, {
  transport: ['websocket'],
  allowEIO3: true,
  cors: '*',
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private redisClient: Redis;
  constructor(
    private socketService: SocketService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private messageService: MessageService,
  ) {
    this.redisClient = socketService.getRedisClient();
  }

  @WebSocketServer()
  public server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log(
      '========================Connection Done========================',
    );
  }

  afterInit(server: Server) {
    this.server = server;
  }

  @UseGuards(WsGuard)
  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      return;
      const userId = socket['userId'];
      const socketKey = SOCKET + userId;
      await this.redisClient.srem(socketKey, socket.id);
      const socketIds = await this.socketService.getSocketIdsByUser(userId);
      if (!socketIds.length) {
        await this.userService.findOneAndUpdate(userId, { onlineNow: false });
        return;
      }
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('verifyFirstConnection')
  @UseGuards(WsGuard)
  async verifyFirstConnection(
    @ConnectedSocket() socket: Socket,
    @CurrentUserWS() user: User,
  ) {
    try {
      (socket as any).userId = user._id.toString();
      const socketKey = SOCKET + user._id.toString();
      await this.redisClient.sadd(socketKey, socket.id);
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('sendMessage')
  @UseGuards(WsGuard)
  async sendMessage(
    @MessageBody() data: CreateMessageDto,
    @CurrentUserWS() user: User,
  ): Promise<Message> {
    try {
      data['sender'] = user._id.toString();
      const [message, socketIdsSender, socketIdsReceiver] = await Promise.all([
        this.messageService.create(data, user),
        this.socketService.getSocketIdsByUser(data['sender']),
        this.socketService.getSocketIdsByUser(data.receiver),
      ]);
      this.sendEventToClient(socketIdsReceiver, 'receiverMessage', message);
      this.sendEventToClient(socketIdsSender, 'confirmMessage', {
        message,
        uuid: data.uuid,
      });
      return message;
    } catch (error) {
      throw error;
    }
  }

  sendEventToClient(socketIds: string[], eventName: string, data) {
    if (socketIds) {
      socketIds.forEach(item => {
        this.server.sockets.to(item).emit(eventName, data);
      });
    }
  }

  async getSocketIdsByUser(userId: string): Promise<string[]> {
    return await this.socketService.getSocketIdsByUser(userId);
  }

  async getSocketIdsMatchedUser(
    userId1: string,
    userId2: string,
  ): Promise<ISocketIdsClient> {
    const [sender, receiver] = await Promise.all([
      this.getSocketIdsByUser(userId1),
      this.getSocketIdsByUser(userId2),
    ]);
    return { sender, receiver };
  }
}
