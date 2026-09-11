import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUnverifiedAlumni(pagination: PaginationQueryDto): Promise<{
        items: {
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
            city: string | null;
            email: string | null;
            mobile: string | null;
            publicKey: string | null;
            id: string;
            isVerified: boolean;
            profilePicUrl: string | null;
            bio: string | null;
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
        name: string;
        role: import(".prisma/client").$Enums.Role;
        city: string | null;
        email: string | null;
        mobile: string | null;
        publicKey: string | null;
        id: string;
        isVerified: boolean;
        profilePicUrl: string | null;
        bio: string | null;
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
