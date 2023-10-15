import { Inject, OnModuleInit, UseFilters, UseGuards, UsePipes, ValidationPipe, forwardRef } from '@nestjs/common';
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
import { CurrentUserWS, MessageStatus, MessageType, SOCKET, WebsocketExceptionsFilter, WsGuard } from '@dating/common';
import { CreateMessageDto, SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';
import { MessageService } from '@modules/message/message.service';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';

import {
  AnswerMessage,
  AnswerMessageResponse,
  CheckRoomMessage,
  CheckRoomMessageResponse,
  OfferMessage,
  OfferMessageResponse,
} from './dto/call.dto';
import { SocketService } from './socket.service';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  transports: ['polling'],
  allowEIO3: true,
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['accessToken'],
  },
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit {
  private rooms: Map<
    string,
    {
      callerId: string;

      offer: any;
      answer: any;
      startTime: string;
      endTime: string;
      socketsIds: Record<string, boolean>;
    }
  > = new Map();
  private roomMapping: Map<string, string> = new Map();

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    private redisService: RedisService,
    private messageService: MessageService,
    private socketService: SocketService,
  ) {}

  async onModuleInit() {
    return;
    console.log('Start scan');
    await this.redisService.deleteWithPrefixKey(SOCKET);
  }

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

      if (this.roomMapping.has(socket.id)) {
        this.hangup(socket.id);
      }

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
      this.server.sockets.to(socket.id).emit('verifyFirstConnection', user);
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('sendMessage')
  @UseGuards(WsGuard)
  async sendMessage(@MessageBody() data: CreateMessageDto, @CurrentUserWS() user: User): Promise<void> {
    console.log('========================sendMessage========================');
    try {
      const message = await this.messageService.create(data, user);
      const [socketIdsSender, socketIdsReceiver] = await Promise.all([
        this.socketService.getSocketIdsByUser(message.sender as string),
        this.socketService.getSocketIdsByUser(message.receiver as string),
      ]);
      // This event emit to all tab of user sent the message in order to those tabs update new message
      this.sendEventToClient(socketIdsSender, 'sentMessage', message);
      this.sendEventToClient(socketIdsReceiver, 'newMessage', message);
      // return {
      //   ...message,
      //   uuid: data.uuid,
      // };
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

  @SubscribeMessage('receivedMessage')
  @UseGuards(WsGuard)
  async receivedMessage(@MessageBody() message: Message): Promise<void> {
    try {
      const newMessage = await this.messageService.findOneAndUpdate(message._id, { status: MessageStatus.RECEIVED });
      const socketIds = await this.socketService.getSocketIdsByUser(message.sender as string);
      this.sendEventToClient(socketIds, 'receivedMessage', newMessage);
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('checkRoom')
  @UseGuards(WsGuard)
  async checkRoom(@MessageBody() data: CheckRoomMessage, @CurrentUserWS() user: User) {
    const socketId = await this.socketService.getSocketIdsByUser(user._id);

    const isRoomExist = await this.rooms.get(data.roomId);
    const payload = {
      offer: isRoomExist ? isRoomExist.offer : null,
      status: !!isRoomExist,
    } satisfies CheckRoomMessageResponse;

    this.server.sockets.to(socketId).emit('checkRoom', payload);
  }

  @SubscribeMessage('offer')
  @UseGuards(WsGuard)
  async handleOffer(@MessageBody() data: OfferMessage, @CurrentUserWS() user: User, @ConnectedSocket() client: Socket) {
    const { roomId, offer } = data;

    const memberIds = await this.messageService.findMembersIdById(roomId);
    const receiverId = memberIds.filter(id => id !== user._id.toString())[0];
    const socketIds = await this.socketService.getSocketIdsByUser(receiverId);

    const roomData = {
      offer,
      callerId: user._id.toString(),
      receiverIds: [],
      socketsIds: { [client.id]: true },
      answer: null,
      startTime: null,
      endTime: null,
    };

    this.rooms.set(roomId, roomData);
    this.roomMapping.set(client.id, roomId);

    const payload = {
      roomId,
      onwner: {
        name: user.name,
        image: user.images[0],
      },
    } satisfies OfferMessageResponse;
    this.sendEventToClient(socketIds, 'offer', payload);
  }

  @SubscribeMessage('answer')
  async handleAnswer(
    @MessageBody() data: AnswerMessage,
    @CurrentUserWS() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, offer } = data;

    const memberIds = await this.messageService.findMembersIdById(roomId);
    const receiverIds = memberIds.filter(id => id !== user._id.toString());
    const socketIds = (await Promise.all(receiverIds.map(id => this.socketService.getSocketIdsByUser(id)))).flat();

    const room = this.rooms.get(roomId);
    room.answer = offer;
    room.startTime = new Date().toISOString();
    room.socketsIds = {
      ...room.socketsIds,
      [client.id]: true,
    };
    this.roomMapping.set(client.id, roomId);

    const payload = {
      offer,
    } satisfies AnswerMessageResponse;
    this.sendEventToClient(socketIds, 'answer', payload);
  }

  @SubscribeMessage('hangup')
  handleHangup(@ConnectedSocket() client: Socket): void {
    this.hangup(client.id);
  }

  async hangup(socketId: string) {
    const roomId = this.roomMapping.get(socketId);
    const room = this.rooms.get(roomId);

    if (!room) return;
    if (!room.callerId) return;
    const userId = room.callerId;
    const user = await this.userService.findOne({ _id: userId });
    const memberIds = await this.messageService.findMembersIdById(roomId);
    const receiverIds = memberIds.filter(id => id !== user._id.toString());

    const messages = {
      userId,
      receiverIds,
      startTime: room.startTime,
      endTime: new Date().toISOString(),
    };

    await Promise.all(
      receiverIds?.map(async id => {
        const message = await this.messageService.create(
          {
            type: MessageType.CALL,
            text: encodeToBase64(JSON.stringify(messages)),
            uuid: uuidv4(),
            receiver: id,
            conversation: roomId,
            createdAt: new Date(),
          },
          user,
        );

        const [socketIdsSender, socketIdsReceiver] = await Promise.all([
          this.socketService.getSocketIdsByUser(message.sender as string),
          this.socketService.getSocketIdsByUser(message.receiver as string),
        ]);
        // This event emit to all tab of user sent the message in order to those tabs update new message
        this.sendEventToClient(socketIdsSender, 'sentMessage', message);
        this.sendEventToClient(socketIdsReceiver, 'newMessage', message);
      }),
    );

    if (room) {
      const socketIds = Object.keys(room?.socketsIds);
      this.sendEventToClient(
        socketIds.filter(id => id !== socketId),
        'hangup',
        null,
      );

      this.roomMapping.delete(socketId);
      this.rooms.delete(roomId);
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

// Hàm encode: Chuyển đổi chuỗi thành Base64
function encodeToBase64(text: string) {
  const binaryData = Buffer.from(text, 'utf-8');
  const base64String = binaryData.toString('base64');
  return base64String;
}

// Hàm decode: Giải mã từ Base64 thành chuỗi
function decodeFromBase64(base64String: string) {
  const binaryData = Buffer.from(base64String, 'base64');
  const decodedString = binaryData.toString('utf-8');
  return decodedString;
}
