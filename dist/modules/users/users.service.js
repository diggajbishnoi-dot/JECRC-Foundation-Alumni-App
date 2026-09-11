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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const storage_service_1 = require("../../services/storage/storage.service");
let UsersService = class UsersService {
    constructor(prisma, redisService, storageService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.storageService = storageService;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentDetails: true,
                alumniDetails: true,
                mentorProfile: true,
                _count: {
                    select: {
                        sentConnections: { where: { status: client_1.ConnectionStatus.ACCEPTED } },
                        receivedConnections: { where: { status: client_1.ConnectionStatus.ACCEPTED } },
                        posts: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User profile not found');
        }
        const totalConnections = user._count.sentConnections + user._count.receivedConnections;
        const { passwordHash, refreshTokenHash, _count, ...safeUser } = user;
        return {
            ...safeUser,
            totalConnections,
            totalPosts: _count.posts,
        };
    }
    async updateMe(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { alumniDetails: true, studentDetails: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.$transaction(async (tx) => {
            const userUpdate = {};
            if (dto.name !== undefined)
                userUpdate.name = dto.name;
            if (dto.bio !== undefined)
                userUpdate.bio = dto.bio;
            if (dto.city !== undefined)
                userUpdate.city = dto.city;
            if (dto.hideLastSeen !== undefined)
                userUpdate.hideLastSeen = dto.hideLastSeen;
            if (Object.keys(userUpdate).length > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: userUpdate,
                });
            }
            if (user.role === client_1.Role.ALUMNI) {
                const alumniData = {};
                if (dto.branch !== undefined)
                    alumniData.branch = dto.branch;
                if (dto.batch !== undefined) {
                    alumniData.batch = dto.batch;
                    const parsed = parseInt(dto.batch, 10);
                    if (!isNaN(parsed))
                        alumniData.passoutYear = parsed;
                }
                if (dto.currentCompany !== undefined)
                    alumniData.currentCompany = dto.currentCompany;
                if (dto.designation !== undefined)
                    alumniData.designation = dto.designation;
                if (Object.keys(alumniData).length > 0) {
                    if (user.alumniDetails) {
                        await tx.alumniDetails.updateMany({
                            where: { userId },
                            data: alumniData,
                        });
                    }
                    else {
                        await tx.alumniDetails.create({
                            data: {
                                userId,
                                branch: dto.branch || 'CSE',
                                batch: dto.batch || '2020',
                                passoutYear: parseInt(dto.batch || '2020', 10) || 2020,
                                currentCompany: dto.currentCompany || '',
                                designation: dto.designation || 'Alumnus',
                            },
                        });
                    }
                }
            }
            else if (user.role === client_1.Role.STUDENT) {
                const studentData = {};
                if (dto.branch !== undefined)
                    studentData.branch = dto.branch;
                if (dto.batch !== undefined) {
                    const parsed = parseInt(dto.batch, 10);
                    if (!isNaN(parsed))
                        studentData.expectedPassoutYear = parsed;
                }
                if (Object.keys(studentData).length > 0) {
                    if (user.studentDetails) {
                        await tx.studentDetails.updateMany({
                            where: { userId },
                            data: studentData,
                        });
                    }
                    else {
                        await tx.studentDetails.create({
                            data: {
                                userId,
                                branch: dto.branch || 'CSE',
                                currentYear: 4,
                                expectedPassoutYear: parseInt(dto.batch || '2027', 10) || 2027,
                            },
                        });
                    }
                }
            }
        });
        const refreshed = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentDetails: true,
                alumniDetails: true,
                mentorProfile: true,
            },
        });
        const { passwordHash, refreshTokenHash, ...safe } = refreshed || user;
        return safe;
    }
    async uploadProfilePicture(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const url = await this.storageService.uploadFile(file, 'avatars');
        await this.prisma.user.update({
            where: { id: userId },
            data: { profilePicUrl: url },
        });
        return { profilePicUrl: url };
    }
    async savePublicKey(userId, dto) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { publicKey: dto.publicKey },
        });
        return { message: 'Public key updated successfully' };
    }
    async getPublicKey(targetUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, name: true, publicKey: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Target user not found');
        }
        if (!user.publicKey) {
            throw new common_1.BadRequestException('User has not initialized end-to-end encryption keys on their device yet.');
        }
        return {
            userId: user.id,
            publicKey: user.publicKey,
        };
    }
    async heartbeat(userId) {
        await this.redisService.set(`user:${userId}:status`, 'online', 45);
        await this.redisService.set(`user:${userId}:last_seen`, new Date().toISOString());
        return { success: true, timestamp: new Date().toISOString() };
    }
    async getPresence(targetUserId, requestingUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, hideLastSeen: true, updatedAt: true },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const isOnline = await this.redisService.isUserOnline(targetUserId);
        let lastSeenStr = null;
        if (targetUserId === requestingUserId || !targetUser.hideLastSeen) {
            const rawLastSeen = (await this.redisService.getLastSeen(targetUserId)) ||
                targetUser.updatedAt?.toISOString() ||
                null;
            if (rawLastSeen && !isOnline) {
                const diffMs = Date.now() - new Date(rawLastSeen).getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                if (diffMins < 1) {
                    lastSeenStr = 'Last seen just now';
                }
                else if (diffMins < 60) {
                    lastSeenStr = `Last seen ${diffMins}m ago`;
                }
                else if (diffHours < 24) {
                    lastSeenStr = `Last seen ${diffHours}h ago`;
                }
                else if (diffDays === 1) {
                    lastSeenStr = 'Last seen yesterday';
                }
                else {
                    lastSeenStr = `Last seen ${diffDays}d ago`;
                }
            }
        }
        return {
            userId: targetUserId,
            status: isOnline ? 'online' : 'offline',
            online: isOnline,
            lastSeen: isOnline ? 'Online' : lastSeenStr || 'Offline',
        };
    }
    async getUserById(targetUserId, requestingUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                studentDetails: true,
                alumniDetails: true,
                mentorProfile: true,
            },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const isConnected = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: requestingUserId, receiverId: targetUserId, status: client_1.ConnectionStatus.ACCEPTED },
                    { requesterId: targetUserId, receiverId: requestingUserId, status: client_1.ConnectionStatus.ACCEPTED },
                ],
            },
        });
        const isSelf = targetUserId === requestingUserId;
        const hasFullAccess = isSelf || !!isConnected;
        return {
            id: targetUser.id,
            name: targetUser.name,
            role: targetUser.role,
            profilePicUrl: targetUser.profilePicUrl,
            city: targetUser.city,
            bio: targetUser.bio,
            studentDetails: targetUser.studentDetails,
            alumniDetails: targetUser.alumniDetails,
            mentorProfile: targetUser.mentorProfile,
            isConnected: !!isConnected,
            email: hasFullAccess ? targetUser.email : undefined,
            mobile: hasFullAccess ? targetUser.mobile : undefined,
        };
    }
    async searchUsers(query) {
        const where = {};
        if (query.role) {
            where.role = query.role;
        }
        if (query.city) {
            where.city = { contains: query.city, mode: 'insensitive' };
        }
        if (query.q) {
            where.OR = [
                { name: { contains: query.q, mode: 'insensitive' } },
                { bio: { contains: query.q, mode: 'insensitive' } },
            ];
        }
        if (query.branch) {
            where.OR = [
                ...(where.OR || []),
                { studentDetails: { branch: { contains: query.branch, mode: 'insensitive' } } },
                { alumniDetails: { branch: { contains: query.branch, mode: 'insensitive' } } },
            ];
        }
        const alumniFilter = {};
        if (query.batch) {
            alumniFilter.batch = { contains: query.batch, mode: 'insensitive' };
        }
        if (query.passoutYear) {
            alumniFilter.passoutYear = query.passoutYear;
        }
        if (query.company) {
            alumniFilter.currentCompany = { contains: query.company, mode: 'insensitive' };
        }
        if (Object.keys(alumniFilter).length > 0) {
            where.alumniDetails = { is: alumniFilter };
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: query.skip,
                take: query.take,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profilePicUrl: true,
                    city: true,
                    bio: true,
                    studentDetails: true,
                    alumniDetails: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items: users,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20)),
            },
        };
    }
    async registerDeviceToken(userId, dto) {
        await this.prisma.deviceToken.upsert({
            where: {
                userId_fcmToken: {
                    userId,
                    fcmToken: dto.fcmToken,
                },
            },
            update: {
                platform: dto.platform,
            },
            create: {
                userId,
                fcmToken: dto.fcmToken,
                platform: dto.platform,
            },
        });
        return { message: 'Device token registered successfully' };
    }
    async deleteAccount(userId) {
        await Promise.all([
            this.prisma.studentDetails.deleteMany({ where: { userId } }),
            this.prisma.alumniDetails.deleteMany({ where: { userId } }),
            this.prisma.mentorProfile.deleteMany({ where: { userId } }),
            this.prisma.connection.deleteMany({ where: { OR: [{ requesterId: userId }, { receiverId: userId }] } }),
            this.prisma.mentorshipRequest.deleteMany({ where: { OR: [{ mentorId: userId }, { studentId: userId }] } }),
            this.prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
            this.prisma.notification.deleteMany({ where: { userId } }),
            this.prisma.deviceToken.deleteMany({ where: { userId } }),
        ]);
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: 'Account deleted successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        storage_service_1.StorageService])
], UsersService);
//# sourceMappingURL=users.service.js.map