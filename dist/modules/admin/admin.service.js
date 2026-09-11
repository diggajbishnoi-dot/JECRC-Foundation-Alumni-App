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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUnverifiedAlumni(pagination) {
        const where = {
            role: client_1.Role.ALUMNI,
            isVerified: false,
        };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    alumniDetails: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items: users.map(({ passwordHash, refreshTokenHash, ...safe }) => safe),
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
    async verifyUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'ACCOUNT_VERIFIED_BY_ADMIN',
                payload: { verifiedAt: new Date().toISOString() },
            },
        });
        const { passwordHash, refreshTokenHash, ...safe } = updated;
        return safe;
    }
    async deletePost(postId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        await this.prisma.post.delete({ where: { id: postId } });
        return { message: 'Post successfully deleted by admin moderation' };
    }
    async deleteDiscussion(threadId) {
        const thread = await this.prisma.discussionThread.findUnique({ where: { id: threadId } });
        if (!thread)
            throw new common_1.NotFoundException('Discussion thread not found');
        await this.prisma.discussionThread.delete({ where: { id: threadId } });
        return { message: 'Discussion thread deleted by admin moderation' };
    }
    async deleteGroup(groupId) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.prisma.group.delete({ where: { id: groupId } });
        return { message: 'Group deleted by admin moderation' };
    }
    async getDashboardStats() {
        const [totalStudents, totalAlumni, totalPosts, totalDiscussions, activeConnections, activeMentorships, totalGroups, pendingAlumniVerifications,] = await Promise.all([
            this.prisma.user.count({ where: { role: client_1.Role.STUDENT } }),
            this.prisma.user.count({ where: { role: client_1.Role.ALUMNI } }),
            this.prisma.post.count(),
            this.prisma.discussionThread.count(),
            this.prisma.connection.count({ where: { status: client_1.ConnectionStatus.ACCEPTED } }),
            this.prisma.mentorshipRequest.count({ where: { status: client_1.MentorshipStatus.ACCEPTED } }),
            this.prisma.group.count(),
            this.prisma.user.count({ where: { role: client_1.Role.ALUMNI, isVerified: false } }),
        ]);
        return {
            totalStudents,
            totalAlumni,
            totalUsers: totalStudents + totalAlumni,
            totalPosts,
            totalDiscussions,
            activeConnections,
            activeMentorships,
            totalGroups,
            pendingAlumniVerifications,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map