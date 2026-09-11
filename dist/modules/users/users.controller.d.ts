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
    updateMe(userId: string, dto: UpdateProfileDto): Promise<{
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
    deleteMe(userId: string): Promise<{
        message: string;
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
            email: string;
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
            bio: string;
            city: string;
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
