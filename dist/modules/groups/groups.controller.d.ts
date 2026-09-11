import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateThreadDto } from '../discussions/dto/discussions.dto';
import { CreateGroupDto, QueryGroupsDto, UpdateGroupDto } from './dto/groups.dto';
import { GroupsService } from './groups.service';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    createGroup(userId: string, dto: CreateGroupDto): Promise<{
        createdById: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.GroupType;
        description: string | null;
    }>;
    getGroups(query: QueryGroupsDto, currentUserId: string): Promise<{
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
        id: string;
        role: import(".prisma/client").$Enums.GroupRole;
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
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                profilePicUrl: string;
            };
        } & {
            userId: string;
            groupId: string;
            id: string;
            role: import(".prisma/client").$Enums.GroupRole;
            joinedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getGroupDiscussions(groupId: string, pagination: PaginationQueryDto, currentUserId: string): Promise<{
        items: ({
            _count: {
                replies: number;
                upvotes: number;
            };
            user: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                profilePicUrl: string;
            };
        } & {
            userId: string;
            groupId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
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
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
    } & {
        userId: string;
        groupId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        reportCount: number;
        category: string;
    }>;
    updateGroup(groupId: string, userId: string, role: Role, dto: UpdateGroupDto): Promise<{
        createdById: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.GroupType;
        description: string | null;
    }>;
    deleteGroup(groupId: string, userId: string, role: Role): Promise<{
        message: string;
    }>;
}
