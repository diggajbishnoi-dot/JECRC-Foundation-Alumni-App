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
            include: { alumniDetails: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const userUpdate = {};
            if (dto.bio !== undefined)
                userUpdate.bio = dto.bio;
            if (dto.city !== undefined)
                userUpdate.city = dto.city;
            if (dto.hideLastSeen !== undefined)
                userUpdate.hideLastSeen = dto.hideLastSeen;
            const res = await tx.user.update({
                where: { id: userId },
                data: userUpdate,
            });
            if (user.role === client_1.Role.ALUMNI &&
                (dto.currentCompany || dto.designation)) {
                await tx.alumniDetails.updateMany({
                    where: { userId },
                    data: {
                        ...(dto.currentCompany && { currentCompany: dto.currentCompany }),
                        ...(dto.designation && { designation: dto.designation }),
                    },
                });
            }
            return res;
        });
        const { passwordHash, refreshTokenHash, ...safe } = updated;
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
    async getPresence(targetUserId, requestingUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, hideLastSeen: true },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const isOnline = await this.redisService.isUserOnline(targetUserId);
        let lastSeen = null;
        if (targetUserId === requestingUserId || !targetUser.hideLastSeen) {
            lastSeen = await this.redisService.getLastSeen(targetUserId);
        }
        return {
            userId: targetUserId,
            status: isOnline ? 'online' : 'offline',
            lastSeen,
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        storage_service_1.StorageService])
], UsersService);
//# sourceMappingURL=users.service.js.map