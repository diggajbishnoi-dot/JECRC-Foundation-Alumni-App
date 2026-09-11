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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(userId, dto) {
        const post = await this.prisma.post.create({
            data: {
                userId,
                type: dto.type,
                title: dto.title,
                description: dto.description,
                company: dto.company || null,
                location: dto.location || null,
                attachmentUrl: dto.attachmentUrl || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicUrl: true,
                        alumniDetails: true,
                    },
                },
            },
        });
        return post;
    }
    async getPostsFeed(query) {
        const where = {};
        if (query.type) {
            where.type = query.type;
        }
        if (query.location) {
            where.location = { contains: query.location, mode: 'insensitive' };
        }
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { createdAt: 'desc' },
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
            }),
            this.prisma.post.count({ where }),
        ]);
        return {
            items: posts,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20)),
            },
        };
    }
    async getPostById(id) {
        const post = await this.prisma.post.findUnique({
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
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        return post;
    }
    async deletePost(id, userId, role) {
        const post = await this.prisma.post.findUnique({
            where: { id },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.userId !== userId && role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to delete this post');
        }
        await this.prisma.post.delete({
            where: { id },
        });
        return { message: 'Post deleted successfully' };
    }
    async reportPost(id) {
        const post = await this.prisma.post.findUnique({
            where: { id },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const updated = await this.prisma.post.update({
            where: { id },
            data: { reportCount: { increment: 1 } },
        });
        return {
            message: 'Post reported to moderation queue. Thank you for keeping our community safe.',
            reportCount: updated.reportCount,
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map