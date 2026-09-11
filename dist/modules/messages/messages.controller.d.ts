import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
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
    markConversationRead(currentUserId: string, otherUserId: string): Promise<{
        updatedCount: number;
    }>;
}
