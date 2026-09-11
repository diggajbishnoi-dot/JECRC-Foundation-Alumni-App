import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../services/storage/storage.service';
import { RegisterDeviceTokenDto, SearchUsersQueryDto, UpdateProfileDto, UploadPublicKeyDto } from './dto/users.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly redisService;
    private readonly storageService;
    constructor(prisma: PrismaService, redisService: RedisService, storageService: StorageService);
    getMe(userId: string): Promise<{
        totalConnections: number;
        totalPosts: number;
        studentDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            currentYear: number;
            expectedPassoutYear: number;
        };
        alumniDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            batch: string;
            passoutYear: number;
            currentCompany: string;
            designation: string;
        };
        mentorProfile: {
            id: string;
            bio: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            domains: string[];
            availability: string;
            maxMentees: number;
            isActive: boolean;
        };
        id: string;
        email: string | null;
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
    updateMe(userId: string, dto: UpdateProfileDto): Promise<{
        studentDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            currentYear: number;
            expectedPassoutYear: number;
        };
        alumniDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            batch: string;
            passoutYear: number;
            currentCompany: string;
            designation: string;
        };
        id: string;
        email: string | null;
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
    uploadProfilePicture(userId: string, file: {
        originalname: string;
        buffer: Buffer;
        mimetype: string;
    }): Promise<{
        profilePicUrl: string;
    }>;
    savePublicKey(userId: string, dto: UploadPublicKeyDto): Promise<{
        message: string;
    }>;
    getPublicKey(targetUserId: string): Promise<{
        userId: string;
        publicKey: string;
    }>;
    heartbeat(userId: string): Promise<{
        success: boolean;
        timestamp: string;
    }>;
    getPresence(targetUserId: string, requestingUserId: string): Promise<{
        userId: string;
        status: string;
        online: boolean;
        lastSeen: string;
    }>;
    getUserById(targetUserId: string, requestingUserId: string): Promise<{
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        profilePicUrl: string;
        city: string;
        bio: string;
        studentDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            currentYear: number;
            expectedPassoutYear: number;
        };
        alumniDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branch: string;
            batch: string;
            passoutYear: number;
            currentCompany: string;
            designation: string;
        };
        mentorProfile: {
            id: string;
            bio: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            domains: string[];
            availability: string;
            maxMentees: number;
            isActive: boolean;
        };
        isConnected: boolean;
        email: string;
        mobile: string;
    }>;
    searchUsers(query: SearchUsersQueryDto): Promise<{
        items: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
            bio: string;
            city: string;
            studentDetails: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                branch: string;
                currentYear: number;
                expectedPassoutYear: number;
            };
            alumniDetails: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
}
