import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { FcmService } from '../../services/fcm/fcm.service';
import { ConnectionsService } from '../connections/connections.service';
import { SendMessageDto } from './dto/messages.dto';
export declare class MessagesService {
    private readonly prisma;
    private readonly connectionsService;
    private readonly redisService;
    private readonly fcmService;
    private readonly logger;
    constructor(prisma: PrismaService, connectionsService: ConnectionsService, redisService: RedisService, fcmService: FcmService);
    sendMessage(senderId: string, dto: SendMessageDto): Promise<{
        receiverId: string;
        senderId: string;
        encryptedContent: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MessageStatus;
        nonce: string;
    }>;
    markDelivered(messageId: string, receiverId: string): Promise<{
        receiverId: string;
        senderId: string;
        id: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MessageStatus;
    }>;
    markRead(messageId: string, receiverId: string): Promise<{
        receiverId: string;
        senderId: string;
        id: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MessageStatus;
    }>;
    markConversationRead(currentUserId: string, otherUserId: string): Promise<{
        updatedCount: number;
    }>;
    getConversationHistory(currentUserId: string, otherUserId: string, pagination: PaginationQueryDto): Promise<{
        items: {
            receiverId: string;
            senderId: string;
            encryptedContent: string;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.MessageStatus;
            nonce: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
