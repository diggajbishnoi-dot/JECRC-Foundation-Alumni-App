import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReplyDto, CreateThreadDto, QueryThreadsDto } from './dto/discussions.dto';
export declare class DiscussionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createThread(userId: string, dto: CreateThreadDto): Promise<{
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        groupId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        reportCount: number;
        category: string;
    }>;
    getThreads(query: QueryThreadsDto, currentUserId?: string): Promise<{
        items: {
            id: string;
            title: string;
            description: string;
            category: string;
            groupId: string;
            createdAt: Date;
            user: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                profilePicUrl: string;
            };
            totalReplies: number;
            totalUpvotes: number;
            isUpvoted: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getThreadById(id: string, currentUserId?: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: string;
        groupId: string;
        createdAt: Date;
        user: {
            studentDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                currentYear: number;
                expectedPassoutYear: number;
            };
            alumniDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
            };
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
        totalReplies: number;
        totalUpvotes: number;
        isUpvoted: boolean;
    }>;
    getThreadReplies(threadId: string, pagination: PaginationQueryDto, currentUserId?: string): Promise<{
        items: {
            id: string;
            threadId: string;
            content: string;
            createdAt: Date;
            user: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                profilePicUrl: string;
            };
            totalUpvotes: number;
            isUpvoted: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createReply(threadId: string, userId: string, dto: CreateReplyDto): Promise<{
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        threadId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
    }>;
    toggleThreadUpvote(threadId: string, userId: string): Promise<{
        upvoted: boolean;
        message: string;
    }>;
    toggleReplyUpvote(replyId: string, userId: string): Promise<{
        upvoted: boolean;
        message: string;
    }>;
    deleteThread(id: string, userId: string, role: Role): Promise<{
        message: string;
    }>;
    deleteReply(replyId: string, userId: string, role: Role): Promise<{
        message: string;
    }>;
    reportThread(id: string): Promise<{
        message: string;
    }>;
}
