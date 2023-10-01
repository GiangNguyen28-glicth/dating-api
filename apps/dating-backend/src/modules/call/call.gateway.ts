import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: 'call',
  cors: true,
})
export class CallController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private users: Map<string, string> = new Map();
  private rooms: Map<string, string> = new Map();

  handleConnection(client) {
    const handshakeData = client.handshake;
    const { userId } = handshakeData.query;
    this.users.set(userId, client.id);
  }

  handleDisconnect(client) {
    const handshakeData = client.handshake;
    const { userId } = handshakeData.query;
    // this.users.delete(userId);
    // this.removeRoom(userId);
  }

  @SubscribeMessage('offer')
  handleOffer(client: any, payload: any): void {
    console.log('🚀 ~ file: call.gateway.ts:40 ~ handleOffer ~ handleOffer:');
    const handshakeData = client.handshake;
    const { userId } = handshakeData.query;

    const [clientId, offer] = payload;
    const socketId = this.users.get(clientId);
    this.server.to(socketId).emit('offer', offer, userId);
  }

  @SubscribeMessage('answer')
  handleAnswer(client: any, payload: any): void {
    console.log('🚀 ~ file: call.gateway.ts:50 ~ handleAnswer ~ handleAnswer:');
    const handshakeData = client.handshake;
    const { userId } = handshakeData.query;

    const [clientId, answer] = payload;
    const socketId = this.users.get(clientId);
    console.log(
      '🚀 ~ file: call.gateway.ts:55 ~ handleAnswer ~ userId, clientId:',
      userId,
      clientId,
    );
    this.setRoom(userId, clientId);
    this.server.to(socketId).emit('answer', answer, userId);
  }

  @SubscribeMessage('hangup')
  handleHangup(client: any): void {
    console.log('🚀 ~ file: call.gateway.ts:63 ~ handleHangup ~ handleHangup:');
    const handshakeData = client.handshake;
    const { userId } = handshakeData.query;

    this.removeRoom(userId);
  }

  setRoom(localId: string, remoteId: string): void {
    this.rooms.set(localId, remoteId);
    this.rooms.set(remoteId, localId);
  }

  removeRoom(userId: string): void {
    const remoteId = this.rooms.get(userId);
    const socketId = this.users.get(remoteId);

    this.server.to(socketId).emit('hangup');

    this.rooms.delete(userId);
    this.rooms.delete(remoteId);
  }
}
