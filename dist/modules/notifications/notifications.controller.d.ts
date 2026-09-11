import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
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
    markAllAsRead(userId: string): Promise<{
        markedCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        isRead: boolean;
    }>;
}
