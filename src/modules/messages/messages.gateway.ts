import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';
import { MarkDeliveredDto, MarkReadDto, SendMessageDto } from './dto/messages.dto';
import { MessagesService } from './messages.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Handle Socket Handshake with JWT Authentication
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authHeader =
        client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!authHeader) {
        this.logger.warn(`Socket connection rejected: No auth token provided (socketId=${client.id})`);
        client.disconnect();
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret = this.configService.get<string>(
        'JWT_SECRET',
        'alumni_super_secret_jwt_access_key_2026_x99',
      );
      const payload = this.jwtService.verify(token, { secret });

      client.userId = payload.sub;
      const userRoom = `user:${client.userId}`;
      client.join(userRoom);

      await this.redisService.setUserOnline(client.userId!, client.id);

      this.logger.log(`Socket connected: userId=${client.userId} socketId=${client.id}`);
    } catch (err) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle Socket Disconnection
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const isCompletelyOffline = await this.redisService.setUserOffline(
        client.userId,
        client.id,
      );
      this.logger.log(
        `Socket disconnected: userId=${client.userId} socketId=${client.id} (completelyOffline=${isCompletelyOffline})`,
      );
    }
  }

  /**
   * Real-time E2E Encrypted Message Event
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    if (!client.userId) {
      return { success: false, error: 'Unauthorized socket session' };
    }

    try {
      const message = await this.messagesService.sendMessage(client.userId, dto);

      // Relay to recipient's personal room if online
      this.server.to(`user:${dto.receiverId}`).emit('newMessage', message);

      return { success: true, message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Message Delivered (single -> double tick)
   */
  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: MarkDeliveredDto,
  ) {
    if (!client.userId) return;

    const updated = await this.messagesService.markDelivered(dto.messageId, client.userId);
    if (updated) {
      // Notify sender that message was delivered to recipient's device
      this.server.to(`user:${updated.senderId}`).emit('messageStatusUpdate', {
        messageId: updated.id,
        status: updated.status,
      });
    }
    return { success: true };
  }

  /**
   * Message Read (double tick turns blue)
   */
  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: MarkReadDto,
  ) {
    if (!client.userId) return;

    const updated = await this.messagesService.markRead(dto.messageId, client.userId);
    if (updated) {
      // Notify sender that message was read
      this.server.to(`user:${updated.senderId}`).emit('messageStatusUpdate', {
        messageId: updated.id,
        status: updated.status,
      });
    }
    return { success: true };
  }

  /**
   * Typing indicator (live ephemeral event, not stored in DB)
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    if (!client.userId || !data?.receiverId) return;

    this.server.to(`user:${data.receiverId}`).emit('userTyping', {
      senderId: client.userId,
    });

    // Clear any previous timeout
    const timeoutKey = `${client.userId}:${data.receiverId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
    }

    // Auto-clear typing after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      this.server.to(`user:${data.receiverId}`).emit('userStoppedTyping', {
        senderId: client.userId,
      });
      this.typingTimeouts.delete(timeoutKey);
    }, 5000);

    this.typingTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Stop typing event
   */
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    if (!client.userId || !data?.receiverId) return;

    const timeoutKey = `${client.userId}:${data.receiverId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }

    this.server.to(`user:${data.receiverId}`).emit('userStoppedTyping', {
      senderId: client.userId,
    });
  }
}
