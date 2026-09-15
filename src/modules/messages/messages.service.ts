import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { FcmService } from '../../services/fcm/fcm.service';
import { StorageService } from '../../services/storage/storage.service';
import { ConnectionsService } from '../connections/connections.service';
import { SendMessageDto } from './dto/messages.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionsService: ConnectionsService,
    private readonly redisService: RedisService,
    private readonly fcmService: FcmService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload chat media/image attachment to Object Storage
   */
  async uploadAttachment(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const url = await this.storageService.uploadFile(file, 'chat');
    return { url };
  }

  async uploadBase64Attachment(base64Data: string, filename?: string) {
    const url = await this.storageService.uploadBase64Image(base64Data, 'chat', filename || 'chat_image.png');
    return { url };
  }

  /**
   * Send End-to-End Encrypted Message
   * CRITICAL: Server only stores & relays { encryptedContent, nonce }.
   * Plaintext message content is structurally never handled or logged.
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    if (!dto.nonce || typeof dto.nonce !== 'string' || !dto.nonce.trim()) {
      throw new BadRequestException('Nonce is required for encrypted message delivery');
    }

    const isConnected = await this.connectionsService.areConnected(senderId, dto.receiverId);
    if (!isConnected) {
      throw new ForbiddenException(
        'Messaging is restricted to accepted connections or active mentorship partners.',
      );
    }

    const nonce = dto.nonce.trim();
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        encryptedContent: dto.encryptedContent,
        nonce,
        status: MessageStatus.SENT,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        encryptedContent: true,
        nonce: true,
        status: true,
        createdAt: true,
      },
    });

    // Logging only metadata, NEVER content
    this.logger.log(
      `[MESSAGE RELAY] id=${message.id} sender=${senderId} receiver=${dto.receiverId} timestamp=${message.createdAt.toISOString()}`,
    );

    // Check if receiver is online; if offline, trigger privacy-safe FCM push notification
    const isReceiverOnline = await this.redisService.isUserOnline(dto.receiverId);
    if (!isReceiverOnline) {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true },
      });

      const tokens = await this.prisma.deviceToken.findMany({
        where: { userId: dto.receiverId },
        select: { fcmToken: true },
      });

      if (tokens.length > 0) {
        // Privacy invariant: ONLY notify that a message arrived, NEVER include content or ciphertext
        await this.fcmService.sendToDeviceTokens(
          tokens.map((t) => t.fcmToken),
          {
            title: 'New Message',
            body: `New message from ${sender?.name || 'an alumni connection'}`,
            data: {
              senderId,
              messageId: message.id,
              type: 'CHAT_MESSAGE',
            },
          },
        );
      }
    }

    return message;
  }

  /**
   * Mark message as DELIVERED (single to double tick)
   */
  async markDelivered(messageId: string, receiverId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.receiverId !== receiverId) {
      return null;
    }

    if (message.status === MessageStatus.READ) {
      return message; // Already read
    }

    return await this.prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.DELIVERED },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mark message as READ (double tick turns blue)
   */
  async markRead(messageId: string, receiverId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.receiverId !== receiverId) {
      return null;
    }

    return await this.prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.READ },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Bulk mark entire conversation as READ
   */
  async markConversationRead(currentUserId: string, otherUserId: string) {
    const res = await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
      },
      data: { status: MessageStatus.READ },
    });

    return { updatedCount: res.count };
  }

  /**
   * Get paginated encrypted message history for local client decryption
   */
  async getConversationHistory(
    currentUserId: string,
    otherUserId: string,
    pagination: PaginationQueryDto,
  ) {
    const isConnected = await this.connectionsService.areConnected(currentUserId, otherUserId);
    if (!isConnected) {
      throw new ForbiddenException('You cannot access chat history with this user');
    }

    const where = {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    };

    // Any messages sent by otherUser to currentUser that were SENT are now DELIVERED
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        status: MessageStatus.SENT,
      },
      data: { status: MessageStatus.DELIVERED },
    });

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' }, // Latest first for mobile pagination
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          encryptedContent: true,
          nonce: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      items: messages.reverse(), // Client displays chronologically
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }
}
