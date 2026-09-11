import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateThreadDto } from '../discussions/dto/discussions.dto';
import { CreateGroupDto, QueryGroupsDto, UpdateGroupDto } from './dto/groups.dto';
export declare class GroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createGroup(userId: string, dto: CreateGroupDto): Promise<{
        createdById: string;
        type: import(".prisma/client").$Enums.GroupType;
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getGroups(query: QueryGroupsDto, currentUserId?: string): Promise<{
        items: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.GroupType;
            description: string;
            createdAt: Date;
            totalMembers: number;
            totalThreads: number;
            isMember: boolean;
            myRole: any;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSuggestedGroups(userId: string): Promise<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.GroupType;
        description: string;
        totalMembers: number;
    }[]>;
    joinGroup(groupId: string, userId: string): Promise<{
        userId: string;
        groupId: string;
        role: import(".prisma/client").$Enums.GroupRole;
        id: string;
        joinedAt: Date;
    }>;
    leaveGroup(groupId: string, userId: string): Promise<{
        message: string;
    }>;
    getGroupMembers(groupId: string, pagination: PaginationQueryDto): Promise<{
        items: ({
            user: {
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
                id: string;
                profilePicUrl: string;
            };
        } & {
            userId: string;
            groupId: string;
            role: import(".prisma/client").$Enums.GroupRole;
            id: string;
            joinedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getGroupDiscussions(groupId: string, pagination: PaginationQueryDto, currentUserId?: string): Promise<{
        items: ({
            _count: {
                replies: number;
                upvotes: number;
            };
            user: {
                name: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                profilePicUrl: string;
            };
        } & {
            userId: string;
            groupId: string | null;
            description: string;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            reportCount: number;
            category: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createGroupDiscussion(groupId: string, userId: string, dto: CreateThreadDto): Promise<{
        user: {
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        groupId: string | null;
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        reportCount: number;
        category: string;
    }>;
    updateGroup(groupId: string, userId: string, userRole: Role, dto: UpdateGroupDto): Promise<{
        createdById: string;
        type: import(".prisma/client").$Enums.GroupType;
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteGroup(groupId: string, userId: string, userRole: Role): Promise<{
        message: string;
    }>;
}
