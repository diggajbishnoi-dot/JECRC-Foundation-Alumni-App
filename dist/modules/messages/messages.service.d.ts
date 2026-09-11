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
        id: string;
        encryptedContent: string;
        nonce: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        createdAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    markDelivered(messageId: string, receiverId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    markRead(messageId: string, receiverId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    markConversationRead(currentUserId: string, otherUserId: string): Promise<{
        updatedCount: number;
    }>;
    getConversationHistory(currentUserId: string, otherUserId: string, pagination: PaginationQueryDto): Promise<{
        items: {
            id: string;
            encryptedContent: string;
            nonce: string;
            status: import(".prisma/client").$Enums.MessageStatus;
            createdAt: Date;
            senderId: string;
            receiverId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
