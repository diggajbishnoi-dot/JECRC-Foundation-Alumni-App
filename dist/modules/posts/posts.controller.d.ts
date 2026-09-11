import { Role } from '@prisma/client';
import { CreatePostDto, QueryPostsDto } from './dto/posts.dto';
import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    createPost(userId: string, dto: CreatePostDto): Promise<{
        user: {
            alumniDetails: {
                userId: string;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        type: import(".prisma/client").$Enums.PostType;
        description: string;
        title: string;
        company: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        location: string | null;
        attachmentUrl: string | null;
        reportCount: number;
    }>;
    getPostsFeed(query: QueryPostsDto): Promise<{
        items: ({
            user: {
                studentDetails: {
                    userId: string;
                    branch: string;
                    currentYear: number;
                    expectedPassoutYear: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                alumniDetails: {
                    userId: string;
                    branch: string;
                    batch: string;
                    passoutYear: number;
                    currentCompany: string;
                    designation: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                name: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                profilePicUrl: string;
            };
        } & {
            userId: string;
            type: import(".prisma/client").$Enums.PostType;
            description: string;
            title: string;
            company: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
                branch: string;
                currentYear: number;
                expectedPassoutYear: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
            alumniDetails: {
                userId: string;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        type: import(".prisma/client").$Enums.PostType;
        description: string;
        title: string;
        company: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
