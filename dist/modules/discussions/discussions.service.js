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
exports.DiscussionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let DiscussionsService = class DiscussionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createThread(userId, dto) {
        return await this.prisma.discussionThread.create({
            data: {
                userId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                groupId: dto.groupId || null,
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
    async getThreads(query, currentUserId) {
        const where = {
            groupId: query.groupId ? query.groupId : null,
        };
        if (query.category) {
            where.category = { equals: query.category, mode: 'insensitive' };
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [threads, total] = await Promise.all([
            this.prisma.discussionThread.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: query.sortBy === 'upvotes'
                    ? { upvotes: { _count: 'desc' } }
                    : { createdAt: 'desc' },
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
                        select: {
                            replies: true,
                            upvotes: true,
                        },
                    },
                    upvotes: currentUserId
                        ? {
                            where: { userId: currentUserId },
                            select: { id: true },
                        }
                        : false,
                },
            }),
            this.prisma.discussionThread.count({ where }),
        ]);
        const formatted = threads.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            groupId: t.groupId,
            createdAt: t.createdAt,
            user: t.user,
            totalReplies: t._count.replies,
            totalUpvotes: t._count.upvotes,
            isUpvoted: currentUserId ? t.upvotes?.length > 0 : false,
        }));
        return {
            items: formatted,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20)),
            },
        };
    }
    async getThreadById(id, currentUserId) {
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id },
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
                _count: {
                    select: {
                        replies: true,
                        upvotes: true,
                    },
                },
                upvotes: currentUserId
                    ? {
                        where: { userId: currentUserId },
                        select: { id: true },
                    }
                    : false,
            },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Discussion thread not found');
        }
        return {
            id: thread.id,
            title: thread.title,
            description: thread.description,
            category: thread.category,
            groupId: thread.groupId,
            createdAt: thread.createdAt,
            user: thread.user,
            totalReplies: thread._count.replies,
            totalUpvotes: thread._count.upvotes,
            isUpvoted: currentUserId ? thread.upvotes?.length > 0 : false,
        };
    }
    async getThreadReplies(threadId, pagination, currentUserId) {
        const where = { threadId };
        const [replies, total] = await Promise.all([
            this.prisma.discussionReply.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { createdAt: 'asc' },
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
                        select: {
                            upvotes: true,
                        },
                    },
                    upvotes: currentUserId
                        ? {
                            where: { userId: currentUserId },
                            select: { id: true },
                        }
                        : false,
                },
            }),
            this.prisma.discussionReply.count({ where }),
        ]);
        const formatted = replies.map((r) => ({
            id: r.id,
            threadId: r.threadId,
            content: r.content,
            createdAt: r.createdAt,
            user: r.user,
            totalUpvotes: r._count.upvotes,
            isUpvoted: currentUserId ? r.upvotes?.length > 0 : false,
        }));
        return {
            items: formatted,
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
    async createReply(threadId, userId, dto) {
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id: threadId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        const reply = await this.prisma.discussionReply.create({
            data: {
                threadId,
                userId,
                content: dto.content,
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
        if (thread.userId !== userId) {
            await this.prisma.notification.create({
                data: {
                    userId: thread.userId,
                    type: 'THREAD_REPLY',
                    payload: {
                        threadId,
                        replyId: reply.id,
                        replierUserId: userId,
                    },
                },
            });
        }
        return reply;
    }
    async toggleThreadUpvote(threadId, userId) {
        const existing = await this.prisma.discussionUpvote.findUnique({
            where: {
                userId_threadId: {
                    userId,
                    threadId,
                },
            },
        });
        if (existing) {
            await this.prisma.discussionUpvote.delete({
                where: { id: existing.id },
            });
            return { upvoted: false, message: 'Upvote removed' };
        }
        await this.prisma.discussionUpvote.create({
            data: {
                userId,
                threadId,
            },
        });
        return { upvoted: true, message: 'Thread upvoted' };
    }
    async toggleReplyUpvote(replyId, userId) {
        const existing = await this.prisma.discussionUpvote.findUnique({
            where: {
                userId_replyId: {
                    userId,
                    replyId,
                },
            },
        });
        if (existing) {
            await this.prisma.discussionUpvote.delete({
                where: { id: existing.id },
            });
            return { upvoted: false, message: 'Upvote removed' };
        }
        await this.prisma.discussionUpvote.create({
            data: {
                userId,
                replyId,
            },
        });
        return { upvoted: true, message: 'Reply upvoted' };
    }
    async deleteThread(id, userId, role) {
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        if (thread.userId !== userId && role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to delete this thread');
        }
        await this.prisma.discussionThread.delete({
            where: { id },
        });
        return { message: 'Discussion thread deleted successfully' };
    }
    async deleteReply(replyId, userId, role) {
        const reply = await this.prisma.discussionReply.findUnique({
            where: { id: replyId },
        });
        if (!reply) {
            throw new common_1.NotFoundException('Reply not found');
        }
        if (reply.userId !== userId && role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to delete this reply');
        }
        await this.prisma.discussionReply.delete({
            where: { id: replyId },
        });
        return { message: 'Reply deleted successfully' };
    }
    async reportThread(id) {
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        await this.prisma.discussionThread.update({
            where: { id },
            data: { reportCount: { increment: 1 } },
        });
        return { message: 'Thread reported for review' };
    }
};
exports.DiscussionsService = DiscussionsService;
exports.DiscussionsService = DiscussionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiscussionsService);
//# sourceMappingURL=discussions.service.js.map