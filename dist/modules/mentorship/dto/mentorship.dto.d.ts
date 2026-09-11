import { MentorshipStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class MentorOptInDto {
    domains: string[];
    bio?: string;
    availability: string;
    maxMentees?: number;
    isActive?: boolean;
}
export declare class CreateMentorshipRequestDto {
    mentorId: string;
    message: string;
}
export declare class QueryMentorsDto extends PaginationQueryDto {
    domain?: string;
    company?: string;
}
export declare class QueryMyMentorshipsDto extends PaginationQueryDto {
    status?: MentorshipStatus;
}
