import { RegisterDeviceTokenDto, SearchUsersQueryDto, UpdateProfileDto, UploadPublicKeyDto } from './dto/users.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    uploadProfilePicture(userId: string, file: any): Promise<{
        profilePicUrl: string;
    }>;
    savePublicKey(userId: string, dto: UploadPublicKeyDto): Promise<{
        message: string;
    }>;
    registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto): Promise<{
        message: string;
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
    getPublicKey(id: string): Promise<{
        userId: string;
        publicKey: string;
    }>;
    getPresence(targetId: string, currentUserId: string): Promise<{
        userId: string;
        status: string;
        lastSeen: string;
    }>;
    getUserById(targetId: string, currentUserId: string): Promise<{
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
}
