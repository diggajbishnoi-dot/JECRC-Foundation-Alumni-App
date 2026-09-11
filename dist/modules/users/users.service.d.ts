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
        mentorProfile: {
            userId: string;
            id: string;
            bio: string | null;
            createdAt: Date;
            updatedAt: Date;
            domains: string[];
            availability: string;
            maxMentees: number;
            isActive: boolean;
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
    }>;
    updateMe(userId: string, dto: UpdateProfileDto): Promise<{
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
    getPresence(targetUserId: string, requestingUserId: string): Promise<{
        userId: string;
        status: string;
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
        mentorProfile: {
            userId: string;
            id: string;
            bio: string | null;
            createdAt: Date;
            updatedAt: Date;
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
            city: string;
            id: string;
            profilePicUrl: string;
            bio: string;
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
}
