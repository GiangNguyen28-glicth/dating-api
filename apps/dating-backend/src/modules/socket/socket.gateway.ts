import { Inject, UseFilters, UseGuards, UsePipes, ValidationPipe, forwardRef } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';

import { RedisService } from '@app/shared';
import {
  CurrentUserWS,
  NotificationType,
  REDIS_KEY_PREFIX,
  SOCKET,
  WebsocketExceptionsFilter,
  WsGuard,
} from '@dating/common';
import { CreateMessageDto, SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';
import { MessageService } from '@modules/message/message.service';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';
import { SocketService } from './socket.service';
import { NotificationService } from '@modules/notification/notification.service';
import { NotificationPayLoad } from './interfaces';
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
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private redisService: RedisService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private messageService: MessageService,
    private socketService: SocketService,
    private notiService: NotificationService,
  ) {}

  @WebSocketServer()
  public server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log('========================Connection Done========================');
  }

  afterInit(server: Server) {
    this.server = server;
  }

  @UseGuards(WsGuard)
  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      const userId = socket['userId'];
      if (!userId) {
        return;
      }
      const socketKey = SOCKET + userId;
      await this.redisService.srem(socketKey, socket.id);
      const socketIds: string[] = await this.redisService.smembers(userId);
      console.log('========================Disconnection========================');
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
  async verifyFirstConnection(@ConnectedSocket() socket: Socket, @CurrentUserWS() user: User) {
    console.log('========================verifyFirstConnection========================');
    try {
      (socket as any).userId = user._id.toString();
      const socketKey = SOCKET + user._id.toString();
      await this.redisService.sadd(socketKey, socket.id);
    } catch (error) {
      throw new WsException(error.message);
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
      const senderKey = SOCKET + (message.sender as string);
      const receiverKey = SOCKET + (message.receiver as string);
      const [socketIdsSender, socketIdsReceiver, notification] = await Promise.all([
        this.socketService.getSocketIdsByUser(senderKey),
        this.socketService.getSocketIdsByUser(receiverKey),
        this.notiService.create({
          sender: user,
          receiver: message.receiver as User,
          type: NotificationType.MATCHED,
          message,
        }),
      ]);
      const REDIS_KEY = `${REDIS_KEY_PREFIX}${message._id.toString()}_${(message.receiver as User)._id.toString()}`;

      await this.redisService.setex({ key: REDIS_KEY, ttl: 10 * 60, data: notification._id.toString() });

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
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('seenMessage')
  @UseGuards(WsGuard)
  async seenMessage(
    @MessageBody() data: SeenMessage,
    @ConnectedSocket() client: Socket,
    // @CurrentUserWS() user: User,
  ) {
    try {
      console.log('========================seenMessage========================');
      await this.messageService.seenMessage(data);
      const senderIds = await this.socketService.getSocketIdsByUser(data.sender);
      const receiverIds = (await this.socketService.getSocketIdsByUser(data.receiver)).filter(id => id !== client.id);

      this.sendEventToClient([...senderIds, ...receiverIds], 'seenMessage', data);
      return data;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('receiveNewNotification')
  @UseGuards(WsGuard)
  async receivedNewMatched(@MessageBody() data, @CurrentUserWS() user: User) {
    try {
      console.log(data);
      // const REDIS_KEY = `${REDIS_KEY_PREFIX.NOTI_MATCHED_}${data.conversation}_${user._id.toString()}`;
      // const notification = await this.redisService.get(REDIS_KEY);
      // if (notification) {
      //   await this.notiService.remove(notification);
      // }
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  sendEventToClient(socketIds: string[], eventName: string, data) {
    if (socketIds) {
      socketIds.forEach(item => {
        this.server.sockets.to(item).emit(eventName, data);
      });
    }
  }
}
