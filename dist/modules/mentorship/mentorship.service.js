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
exports.MentorshipService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let MentorshipService = class MentorshipService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async optInAsMentor(userId, userRole, dto) {
        if (userRole !== client_1.Role.ALUMNI) {
            throw new common_1.ForbiddenException('Only Alumni users can register as mentors');
        }
        const profile = await this.prisma.mentorProfile.upsert({
            where: { userId },
            update: {
                domains: dto.domains,
                bio: dto.bio,
                availability: dto.availability,
                maxMentees: dto.maxMentees ?? 3,
                isActive: dto.isActive ?? true,
            },
            create: {
                userId,
                domains: dto.domains,
                bio: dto.bio,
                availability: dto.availability,
                maxMentees: dto.maxMentees ?? 3,
                isActive: dto.isActive ?? true,
            },
        });
        return profile;
    }
    async getMentors(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const take = limit;
        const where = {
            isActive: true,
            user: { isVerified: true },
        };
        if (query.domain) {
            where.domains = { has: query.domain };
        }
        if (query.company) {
            where.user = {
                ...where.user,
                alumniDetails: {
                    currentCompany: { contains: query.company, mode: 'insensitive' },
                },
            };
        }
        const [mentors, total] = await Promise.all([
            this.prisma.mentorProfile.findMany({
                where,
                skip,
                take,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePicUrl: true,
                            city: true,
                            alumniDetails: true,
                        },
                    },
                },
            }),
            this.prisma.mentorProfile.count({ where }),
        ]);
        const mentorUserIds = mentors.map((m) => m.userId);
        const activeMentorships = await this.prisma.mentorshipRequest.groupBy({
            by: ['mentorId'],
            where: {
                mentorId: { in: mentorUserIds },
                status: client_1.MentorshipStatus.ACCEPTED,
            },
            _count: { _all: true },
        });
        const activeCountMap = new Map();
        for (const item of activeMentorships) {
            activeCountMap.set(item.mentorId, item._count._all);
        }
        const items = mentors.map((m) => {
            const activeMenteesCount = activeCountMap.get(m.userId) || 0;
            return {
                id: m.id,
                userId: m.userId,
                domains: m.domains,
                bio: m.bio,
                availability: m.availability,
                maxMentees: m.maxMentees,
                isActive: m.isActive,
                user: m.user,
                activeMenteesCount,
                isAcceptingMentees: activeMenteesCount < m.maxMentees,
            };
        });
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async requestMentorship(studentId, studentRole, dto) {
        if (studentRole !== client_1.Role.STUDENT) {
            throw new common_1.ForbiddenException('Only students can request alumni mentorship');
        }
        if (studentId === dto.mentorId) {
            throw new common_1.BadRequestException('You cannot request mentorship from yourself');
        }
        const mentorProfile = await this.prisma.mentorProfile.findUnique({
            where: { userId: dto.mentorId },
        });
        if (!mentorProfile || !mentorProfile.isActive) {
            throw new common_1.BadRequestException('This alumni is currently not accepting mentorship requests');
        }
        const activeCount = await this.prisma.mentorshipRequest.count({
            where: {
                mentorId: dto.mentorId,
                status: client_1.MentorshipStatus.ACCEPTED,
            },
        });
        if (activeCount >= mentorProfile.maxMentees) {
            throw new common_1.BadRequestException('This mentor has reached their maximum capacity of active mentees at this time');
        }
        const existing = await this.prisma.mentorshipRequest.findFirst({
            where: {
                studentId,
                mentorId: dto.mentorId,
                status: { in: [client_1.MentorshipStatus.PENDING, client_1.MentorshipStatus.ACCEPTED] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(existing.status === client_1.MentorshipStatus.ACCEPTED
                ? 'You already have an active mentorship with this mentor'
                : 'You already have a pending mentorship request to this mentor');
        }
        const request = await this.prisma.mentorshipRequest.create({
            data: {
                studentId,
                mentorId: dto.mentorId,
                message: dto.message,
                status: client_1.MentorshipStatus.PENDING,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: dto.mentorId,
                type: 'MENTORSHIP_REQUEST',
                payload: { studentId, mentorshipId: request.id },
            },
        });
        return request;
    }
    async acceptMentorship(mentorId, requestId) {
        const request = await this.prisma.mentorshipRequest.findUnique({
            where: { id: requestId },
        });
        if (!request || request.mentorId !== mentorId) {
            throw new common_1.NotFoundException('Mentorship request not found');
        }
        const mentorProfile = await this.prisma.mentorProfile.findUnique({
            where: { userId: mentorId },
        });
        const activeCount = await this.prisma.mentorshipRequest.count({
            where: { mentorId, status: client_1.MentorshipStatus.ACCEPTED },
        });
        if (mentorProfile && activeCount >= mentorProfile.maxMentees) {
            throw new common_1.BadRequestException('You have reached your maximum number of active mentees');
        }
        const updated = await this.prisma.mentorshipRequest.update({
            where: { id: requestId },
            data: { status: client_1.MentorshipStatus.ACCEPTED },
        });
        await this.prisma.notification.create({
            data: {
                userId: request.studentId,
                type: 'MENTORSHIP_ACCEPTED',
                payload: { mentorId, mentorshipId: requestId },
            },
        });
        return updated;
    }
    async rejectMentorship(mentorId, requestId) {
        const request = await this.prisma.mentorshipRequest.findUnique({
            where: { id: requestId },
        });
        if (!request || request.mentorId !== mentorId) {
            throw new common_1.NotFoundException('Mentorship request not found');
        }
        return await this.prisma.mentorshipRequest.update({
            where: { id: requestId },
            data: { status: client_1.MentorshipStatus.REJECTED },
        });
    }
    async closeMentorship(userId, requestId, targetStatus) {
        const request = await this.prisma.mentorshipRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new common_1.NotFoundException('Mentorship request not found');
        }
        if (request.studentId !== userId && request.mentorId !== userId) {
            throw new common_1.ForbiddenException('Only the student or mentor can close this relationship');
        }
        return await this.prisma.mentorshipRequest.update({
            where: { id: requestId },
            data: { status: targetStatus },
        });
    }
    async getMyMentorships(userId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const take = limit;
        const where = {
            OR: [{ studentId: userId }, { mentorId: userId }],
        };
        if (query.status) {
            where.status = query.status;
        }
        const [items, total] = await Promise.all([
            this.prisma.mentorshipRequest.findMany({
                where,
                skip,
                take,
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            profilePicUrl: true,
                            studentDetails: true,
                        },
                    },
                    mentor: {
                        select: {
                            id: true,
                            name: true,
                            profilePicUrl: true,
                            alumniDetails: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.mentorshipRequest.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.MentorshipService = MentorshipService;
exports.MentorshipService = MentorshipService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MentorshipService);
//# sourceMappingURL=mentorship.service.js.map