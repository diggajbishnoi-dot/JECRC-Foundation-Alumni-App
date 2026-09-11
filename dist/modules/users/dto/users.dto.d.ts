import { Platform, Role } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class UpdateProfileDto {
    bio?: string;
    city?: string;
    hideLastSeen?: boolean;
    currentCompany?: string;
    designation?: string;
}
export declare class UploadPublicKeyDto {
    publicKey: string;
}
export declare class RegisterDeviceTokenDto {
    fcmToken: string;
    platform: Platform;
}
export declare class SearchUsersQueryDto extends PaginationQueryDto {
    q?: string;
    role?: Role;
    branch?: string;
    batch?: string;
    passoutYear?: number;
    company?: string;
    city?: string;
}
