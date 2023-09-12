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
  WsException,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

import {
  CurrentUserWS,
  ISocketIdsClient,
  SOCKET,
  WebsocketExceptionsFilter,
  WsGuard,
} from '@dating/common';
import {
  CreateMessageDto,
  SeenMessage,
  MessageService,
  Message,
} from '@modules/message';
import { UserService, User } from '@modules/users';
import { ActionService } from '@modules/action';

import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://0684-2a09-bac5-d46e-18c8-00-278-66.ngrok-free.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['accessToken'],
  },
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
    @Inject(forwardRef(() => ActionService))
    private actionService: ActionService,
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
      const userId = socket['userId'];
      const socketKey = SOCKET + userId;
      await this.redisClient.srem(socketKey, socket.id);
      const socketIds = await this.socketService.getSocketIdsByUser(userId);
      console.log(
        '========================Disconnection========================',
      );
      if (!socketIds.length) {
        await this.userService.findOneAndUpdate(userId, { onlineNow: false });
        return;
      }
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('verifyFirstConnection')
  @UseGuards(WsGuard)
  async verifyFirstConnection(
    @ConnectedSocket() socket: Socket,
    @CurrentUserWS() user: User,
  ) {
    console.log(
      '========================verifyFirstConnection========================',
    );
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
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
    @CurrentUserWS() user: User,
  ): Promise<
    Message & {
      uuid: string;
    }
  > {
    console.log('========================sendMessage========================');

    try {
      const message = await this.messageService.create(data, user);
      const [socketIdsSender, socketIdsReceiver] = await Promise.all([
        this.socketService.getSocketIdsByUser(message.sender as string),
        this.socketService.getSocketIdsByUser(message.receiver as string),
      ]);

      // This event emit to all tab of user sent the message in order to those tabs update new message
      this.sendEventToClient(
        socketIdsSender.filter(id => id !== client.id),
        'sentMessage',
        message,
      );
      this.sendEventToClient(socketIdsReceiver, 'newMessage', message);
      return {
        ...message,
        uuid: data.uuid,
      };
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('seenMessage')
  @UseGuards(WsGuard)
  async seenMessage(
    @MessageBody() data: SeenMessage,
    @ConnectedSocket() client: Socket,
    // @CurrentUserWS() user: User,
  ) {
    console.log('========================seenMessage========================');
    await this.messageService.seenMessage(data);
    const senderIds = await this.socketService.getSocketIdsByUser(data.sender);
    const receiverIds = (
      await this.socketService.getSocketIdsByUser(data.receiver)
    ).filter(id => id !== client.id);

    this.sendEventToClient([...senderIds, ...receiverIds], 'seenMessage', data);
    return data;
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
