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
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { RedisService } from '@app/shared';
import {
  CurrentUserWS,
  MessageStatus,
  MessageType,
  SOCKET,
  SOCKET_ID_TTL,
  WebsocketExceptionsFilter,
  WsGuard,
} from '@dating/common';
import { CreateMessageDto, SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';
import { MessageService } from '@modules/message/message.service';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';

import { v4 as uuidv4 } from 'uuid';
import {
  AnswerMessage,
  AnswerMessageResponse,
  CheckRoomMessage,
  CheckRoomMessageResponse,
  OfferMessage,
  OfferMessageResponse,
  RejectMessage,
  RejectMessageResponse,
} from './dto/call.dto';
import { SocketService } from './socket.service';
import { roomMapping, rooms, userAvailable } from './socket.service';

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
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    private redisService: RedisService,
    private messageService: MessageService,
    private socketService: SocketService,
  ) {}

  async onModuleInit() {
    return;
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

      if (roomMapping.has(socket.id)) {
        const roomId = roomMapping.get(socket.id);
        this.hangup(roomId);
      }

      const socketIds: string[] = await this.redisService.smembers(userId);
      console.log('========================Disconnection========================');
      if (!socketIds.length) {
        await this.userService.findOneAndUpdate(userId, { onlineNow: false, lastActiveDate: new Date() });
      }
    } catch (error) {
      return;
    }
  }

  @SubscribeMessage('verifyFirstConnection')
  @UseGuards(WsGuard)
  async verifyFirstConnection(@ConnectedSocket() socket: Socket, @CurrentUserWS() user: User) {
    console.log('========================verifyFirstConnection========================');
    try {
      (socket as any).userId = user._id.toString();
      const key = SOCKET + user._id.toString();
      await this.redisService.sadd({ key, data: socket.id, ttl: SOCKET_ID_TTL });
      await this.userService.findOneAndUpdate(user._id, { lastActiveDate: new Date() });
      this.server.sockets.to(socket.id).emit('verifyFirstConnection', user);
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('sendMessage')
  @UseGuards(WsGuard)
  async sendMessage(@MessageBody() data: CreateMessageDto, @CurrentUserWS() user: User): Promise<void> {
    console.log('========================sendMessage========================');
    try {
      const message = await this.messageService.create(data, user);
      const [socketIdsSender, socketIdsReceiver] = await Promise.all([
        this.socketService.getSocketIdsByUser(message.sender.toString()),
        this.socketService.getSocketIdsByUser(message.receiver.toString()),
      ]);
      // This event emit to all tab of user sent the message in order to those tabs update new message
      this.sendEventToClient(socketIdsSender, 'sentMessage', message);
      this.sendEventToClient(socketIdsReceiver, 'newMessage', message);
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('seenMessage')
  @UseGuards(WsGuard)
  async seenMessage(@MessageBody() data: SeenMessage, @ConnectedSocket() client: Socket) {
    try {
      console.log('========================seenMessage========================');
      await this.messageService.seenMessage(data);
      const senderIds = await this.socketService.getSocketIdsByUser(data.sender);
      const receiverIds = (await this.socketService.getSocketIdsByUser(data.receiver)).filter(id => id !== client.id);

      this.sendEventToClient([...senderIds, ...receiverIds], 'seenMessage', data);
      return data;
    } catch (error) {
      throw error;
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
      throw error;
    }
  }

  @SubscribeMessage('checkRoom')
  @UseGuards(WsGuard)
  async checkRoom(@MessageBody() data: CheckRoomMessage, @CurrentUserWS() user: User) {
    const socketId = await this.socketService.getSocketIdsByUser(user._id);

    const isRoomExist = await rooms.get(data.roomId);
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

    rooms.set(roomId, roomData);
    roomMapping.set(client.id, roomId);
    userAvailable.set(user._id.toString(), true);

    const payload = {
      roomId,
      owner: {
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

    const withWithoutSocketCurrentId = (socketId: string[]) => {
      if (socketId.includes(client.id)) {
        return socketId;
      }
      return [...socketId, client.id];
    };
    const socketCurrentIds = withWithoutSocketCurrentId(await this.socketService.getSocketIdsByUser(user._id));

    const room = rooms.get(roomId);
    room.answer = offer;
    room.startTime = new Date();
    room.socketsIds = {
      ...room.socketsIds,
      [client.id]: true,
    };
    roomMapping.set(client.id, roomId);
    userAvailable.set(user._id.toString(), true);

    const payload = {
      offer,
    } satisfies AnswerMessageResponse;

    this.sendEventToClient(socketIds, 'answer', payload);
    this.sendEventToClient(socketCurrentIds, 'reject', { status: false });
  }

  @SubscribeMessage('reject')
  async handleReject(@MessageBody() data: RejectMessage, @CurrentUserWS() user: User) {
    const { roomId } = data;
    const socketIds = await this.socketService.getSocketIdsByUser(user._id);

    const payload = {
      status: true,
    } satisfies RejectMessageResponse;

    this.hangup(roomId);
    this.sendEventToClient(socketIds, 'reject', payload);
  }

  @SubscribeMessage('hangup')
  handleHangup(@ConnectedSocket() client: Socket): void {
    const roomId = roomMapping.get(client.id);
    this.hangup(roomId);
  }

  async hangup(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!room.callerId) return;
    const userId = room.callerId;
    userAvailable.delete(userId);

    const [user, memberIds] = await Promise.all([
      this.userService.findOne({ _id: userId }),
      this.messageService.findMembersIdById(roomId),
    ]);
    const receiverId = memberIds.filter(id => id !== user._id.toString())[0];

    const messages = {
      userId,
      receiverIds: [receiverId],
      startTime: room.startTime,
      endTime: new Date(),
    };

    const messageType = messages.startTime ? MessageType.CALL : MessageType.MISSED;
    const message = await this.messageService.create(
      {
        type: messageType,
        text: encodeToBase64(JSON.stringify(messages)),
        uuid: uuidv4(),
        receiver: receiverId,
        conversation: roomId,
        createdAt: new Date(),
        startTime: messages.startTime,
        endTime: messages.endTime,
      },
      user,
    );

    userAvailable.delete(receiverId);
    const [socketIdsSender, socketIdsReceiver] = await Promise.all([
      this.socketService.getSocketIdsByUser(message.sender as string),
      this.socketService.getSocketIdsByUser(message.receiver as string),
    ]);
    this.sendEventToClient(socketIdsSender, 'sentMessage', message);
    this.sendEventToClient(socketIdsReceiver, 'newMessage', message);

    if (!room) return;

    const socketIds = Object.keys(room?.socketsIds);
    if (!room?.answer) {
      const socketId = await this.socketService.getSocketIdsByUser(receiverId);
      this.sendEventToClient(socketId, 'reject', { status: false });
    }

    this.sendEventToClient(socketIds, 'hangup', {
      messageId: message._id,
    });
    socketIds.forEach(socketId => {
      roomMapping.delete(socketId);
    });
    rooms.delete(roomId);
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
