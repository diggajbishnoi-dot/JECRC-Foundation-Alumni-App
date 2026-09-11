import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUnverifiedAlumni(pagination: PaginationQueryDto): Promise<{
        items: {
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
            email: string | null;
            id: string;
            mobile: string | null;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
            profilePicUrl: string | null;
            bio: string | null;
            city: string | null;
            publicKey: string | null;
            hideLastSeen: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    verifyUser(userId: string): Promise<{
        email: string | null;
        id: string;
        mobile: string | null;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        profilePicUrl: string | null;
        bio: string | null;
        city: string | null;
        publicKey: string | null;
        hideLastSeen: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(postId: string): Promise<{
        message: string;
    }>;
    deleteDiscussion(threadId: string): Promise<{
        message: string;
    }>;
    deleteGroup(groupId: string): Promise<{
        message: string;
    }>;
    getDashboardStats(): Promise<{
        totalStudents: number;
        totalAlumni: number;
        totalUsers: number;
        totalPosts: number;
        totalDiscussions: number;
        activeConnections: number;
        activeMentorships: number;
        totalGroups: number;
        pendingAlumniVerifications: number;
    }>;
}
