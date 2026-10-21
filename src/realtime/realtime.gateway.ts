import {
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

interface CallQueueMessage {
  dep_call?: string;
  [key: string]: unknown;
}

/**
 * event และการส่งต่อเหมือน web-aranhos-api/src/queues/socket-queue/socket-queue.gateway.ts
 * client emit มา แล้ว server ส่งต่อให้ทุกเครื่อง
 * ที่ต่างคือตั้ง ping ให้ถี่ขึ้น จะได้รู้เร็วขึ้นว่าเครื่องไหนหลุด และให้ client ต่อใหม่ได้เร็ว
 */
@WebSocketGateway({ cors: true, pingInterval: 10000, pingTimeout: 20000 })
export class RealtimeGateway implements OnGatewayInit {
  private server!: Server;

  afterInit(server: Server) {
    this.server = server;
  }

  connectedCount(): number {
    return this.server?.engine.clientsCount ?? 0;
  }

  @SubscribeMessage('queue/call-queue')
  call(@MessageBody() dto: CallQueueMessage) {
    this.server.emit(`queue/call-monitor/${dto?.dep_call}`, dto);
    this.server.emit(`queue/update-list-queue/${dto?.dep_call}`, dto);
  }

  @SubscribeMessage('queue/update-list-queue')
  updateListQueue(@MessageBody() dto: CallQueueMessage) {
    this.server.emit(`queue/update-list-queue/${dto?.dep_call}`, dto);
  }
}
