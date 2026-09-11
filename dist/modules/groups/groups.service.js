"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let GroupsService = class GroupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGroup(userId, dto) {
        const group = await this.prisma.$transaction(async (tx) => {
            const newGroup = await tx.group.create({
                data: {
                    name: dto.name,
                    type: dto.type,
                    description: dto.description || null,
                    createdById: userId,
                },
            });
            await tx.groupMembership.create({
                data: {
                    groupId: newGroup.id,
                    userId,
                    role: client_1.GroupRole.ADMIN,
                },
            });
            return newGroup;
        });
        return group;
    }
    async getGroups(query, currentUserId) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const take = limit;
        const where = {};
        if (query.type) {
            where.type = query.type;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [groups, total] = await Promise.all([
            this.prisma.group.findMany({
                where,
                skip,
                take,
                include: {
                    _count: {
                        select: { memberships: true, threads: true },
                    },
                    memberships: currentUserId
                        ? {
                            where: { userId: currentUserId },
                            select: { role: true },
                        }
                        : false,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.group.count({ where }),
        ]);
        const formatted = groups.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            description: g.description,
            createdAt: g.createdAt,
            totalMembers: g._count.memberships,
            totalThreads: g._count.threads,
            isMember: currentUserId ? g.memberships?.length > 0 : false,
            myRole: currentUserId && g.memberships?.[0]?.role ? g.memberships[0].role : null,
        }));
        return {
            items: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getSuggestedGroups(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { studentDetails: true, alumniDetails: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const searchTerms = [];
        if (user.studentDetails) {
            searchTerms.push(user.studentDetails.branch);
            searchTerms.push(user.studentDetails.expectedPassoutYear.toString());
        }
        if (user.alumniDetails) {
            searchTerms.push(user.alumniDetails.branch);
            searchTerms.push(user.alumniDetails.batch);
            searchTerms.push(user.alumniDetails.passoutYear.toString());
        }
        const orClauses = searchTerms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
        ]);
        const suggested = await this.prisma.group.findMany({
            where: {
                OR: orClauses.length > 0 ? orClauses : undefined,
                memberships: {
                    none: { userId },
                },
            },
            take: 10,
            include: {
                _count: { select: { memberships: true } },
            },
        });
        return suggested.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            description: g.description,
            totalMembers: g._count.memberships,
        }));
    }
    async joinGroup(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const existing = await this.prisma.groupMembership.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('You are already a member of this group');
        }
        return await this.prisma.groupMembership.create({
            data: {
                groupId,
                userId,
                role: client_1.GroupRole.MEMBER,
            },
        });
    }
    async leaveGroup(groupId, userId) {
        const membership = await this.prisma.groupMembership.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('You are not a member of this group');
        }
        await this.prisma.groupMembership.delete({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
        return { message: 'Successfully left the group' };
    }
    async getGroupMembers(groupId, pagination) {
        const where = { groupId };
        const [members, total] = await Promise.all([
            this.prisma.groupMembership.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profilePicUrl: true,
                            alumniDetails: true,
                            studentDetails: true,
                        },
                    },
                },
                orderBy: { joinedAt: 'asc' },
            }),
            this.prisma.groupMembership.count({ where }),
        ]);
        return {
            items: members,
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
    async getGroupDiscussions(groupId, pagination, currentUserId) {
        const where = { groupId };
        const [threads, total] = await Promise.all([
            this.prisma.discussionThread.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profilePicUrl: true,
                        },
                    },
                    _count: {
                        select: { replies: true, upvotes: true },
                    },
                },
            }),
            this.prisma.discussionThread.count({ where }),
        ]);
        return {
            items: threads,
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
    async createGroupDiscussion(groupId, userId, dto) {
        const membership = await this.prisma.groupMembership.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You must join this group before posting discussions');
        }
        return await this.prisma.discussionThread.create({
            data: {
                title: dto.title,
                description: dto.description,
                category: dto.category,
                groupId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicUrl: true,
                    },
                },
            },
        });
    }
    async updateGroup(groupId, userId, userRole, dto) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = await this.prisma.groupMembership.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
        const isGroupAdmin = membership?.role === client_1.GroupRole.ADMIN;
        const isCreator = group.createdById === userId;
        const isPlatformAdmin = userRole === client_1.Role.ADMIN;
        if (!isGroupAdmin && !isCreator && !isPlatformAdmin) {
            throw new common_1.ForbiddenException('Only group admins or creators can update group details');
        }
        return await this.prisma.group.update({
            where: { id: groupId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });
    }
    async deleteGroup(groupId, userId, userRole) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        if (group.createdById !== userId && userRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the group creator or platform admin can delete this group');
        }
        await this.prisma.group.delete({
            where: { id: groupId },
        });
        return { message: 'Group deleted successfully' };
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map