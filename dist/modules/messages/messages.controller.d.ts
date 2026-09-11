import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { SendMessageDto } from './dto/messages.dto';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    sendMessage(currentUserId: string, dto: SendMessageDto): Promise<{
        id: string;
        encryptedContent: string;
        nonce: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        createdAt: Date;
        senderId: string;
        receiverId: string;
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
    markConversationRead(currentUserId: string, otherUserId: string): Promise<{
        updatedCount: number;
    }>;
}
