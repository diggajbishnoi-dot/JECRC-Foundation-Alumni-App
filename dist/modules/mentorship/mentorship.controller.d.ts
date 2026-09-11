import { Role } from '@prisma/client';
import { CreateMentorshipRequestDto, MentorOptInDto, QueryMentorsDto, QueryMyMentorshipsDto } from './dto/mentorship.dto';
import { MentorshipService } from './mentorship.service';
export declare class MentorshipController {
    private readonly mentorshipService;
    constructor(mentorshipService: MentorshipService);
    optIn(userId: string, role: Role, dto: MentorOptInDto): Promise<{
        userId: string;
        id: string;
        bio: string | null;
        createdAt: Date;
        updatedAt: Date;
        domains: string[];
        availability: string;
        maxMentees: number;
        isActive: boolean;
    }>;
    getMentors(query: QueryMentorsDto): Promise<{
        items: {
            id: string;
            userId: string;
            domains: string[];
            bio: string;
            availability: string;
            maxMentees: number;
            isActive: boolean;
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
                profilePicUrl: string;
                city: string;
            };
            activeMenteesCount: number;
            isAcceptingMentees: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    requestMentorship(studentId: string, role: Role, dto: CreateMentorshipRequestDto): Promise<{
        message: string;
        studentId: string;
        mentorId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
    }>;
    acceptMentorship(mentorId: string, requestId: string): Promise<{
        message: string;
        studentId: string;
        mentorId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
    }>;
    rejectMentorship(mentorId: string, requestId: string): Promise<{
        message: string;
        studentId: string;
        mentorId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
    }>;
    completeMentorship(userId: string, requestId: string): Promise<{
        message: string;
        studentId: string;
        mentorId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
    }>;
    endMentorship(userId: string, requestId: string): Promise<{
        message: string;
        studentId: string;
        mentorId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
    }>;
    getMyMentorships(userId: string, query: QueryMyMentorshipsDto): Promise<{
        items: ({
            student: {
                studentDetails: {
                    userId: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    branch: string;
                    currentYear: number;
                    expectedPassoutYear: number;
                };
                id: string;
                name: string;
                profilePicUrl: string;
            };
            mentor: {
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
                profilePicUrl: string;
            };
        } & {
            message: string;
            studentId: string;
            mentorId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.MentorshipStatus;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
