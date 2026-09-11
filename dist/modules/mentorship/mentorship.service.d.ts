import { MentorshipStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMentorshipRequestDto, MentorOptInDto, QueryMentorsDto, QueryMyMentorshipsDto } from './dto/mentorship.dto';
export declare class MentorshipService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    optInAsMentor(userId: string, userRole: Role, dto: MentorOptInDto): Promise<{
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
                city: string;
                id: string;
                profilePicUrl: string;
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
    requestMentorship(studentId: string, studentRole: Role, dto: CreateMentorshipRequestDto): Promise<{
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
    closeMentorship(userId: string, requestId: string, targetStatus: MentorshipStatus): Promise<{
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
                    branch: string;
                    currentYear: number;
                    expectedPassoutYear: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                name: string;
                id: string;
                profilePicUrl: string;
            };
            mentor: {
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
                id: string;
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
