import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getNotifications(userId: string, pagination: PaginationQueryDto): Promise<{
        items: {
            userId: string;
            id: string;
            createdAt: Date;
            type: string;
            payload: import("@prisma/client/runtime/library").JsonValue;
            isRead: boolean;
        }[];
        unreadCount: number;
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        markedCount: number;
    }>;
}
