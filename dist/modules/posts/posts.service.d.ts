import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, QueryPostsDto } from './dto/posts.dto';
export declare class PostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPost(userId: string, dto: CreatePostDto): Promise<{
        user: {
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
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.PostType;
        description: string;
        title: string;
        company: string | null;
        location: string | null;
        attachmentUrl: string | null;
        reportCount: number;
    }>;
    getPostsFeed(query: QueryPostsDto): Promise<{
        items: ({
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
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.PostType;
            description: string;
            title: string;
            company: string | null;
            location: string | null;
            attachmentUrl: string | null;
            reportCount: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPostById(id: string): Promise<{
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
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.PostType;
        description: string;
        title: string;
        company: string | null;
        location: string | null;
        attachmentUrl: string | null;
        reportCount: number;
    }>;
    deletePost(id: string, userId: string, role: Role): Promise<{
        message: string;
    }>;
    reportPost(id: string): Promise<{
        message: string;
        reportCount: number;
    }>;
}
