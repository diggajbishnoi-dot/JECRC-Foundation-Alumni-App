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
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ConnectionsService = class ConnectionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendRequest(requesterId, receiverId) {
        if (requesterId === receiverId) {
            throw new common_1.BadRequestException('You cannot send a connection request to yourself');
        }
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new common_1.NotFoundException('Receiver user not found');
        }
        const existing = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId, receiverId },
                    { requesterId: receiverId, receiverId: requesterId },
                ],
            },
        });
        if (existing) {
            if (existing.status === client_1.ConnectionStatus.ACCEPTED) {
                throw new common_1.ConflictException('You are already connected with this user');
            }
            if (existing.status === client_1.ConnectionStatus.PENDING) {
                throw new common_1.ConflictException('A connection request is already pending between both of you');
            }
            const updated = await this.prisma.connection.update({
                where: { id: existing.id },
                data: {
                    requesterId,
                    receiverId,
                    status: client_1.ConnectionStatus.PENDING,
                },
            });
            await this.prisma.notification.create({
                data: {
                    userId: receiverId,
                    type: 'CONNECTION_REQUEST',
                    payload: { requesterId, connectionId: updated.id },
                },
            });
            return updated;
        }
        const connection = await this.prisma.connection.create({
            data: {
                requesterId,
                receiverId,
                status: client_1.ConnectionStatus.PENDING,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'CONNECTION_REQUEST',
                payload: { requesterId, connectionId: connection.id },
            },
        });
        return connection;
    }
    async acceptRequest(userId, connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection request not found');
        }
        if (connection.receiverId !== userId) {
            throw new common_1.ForbiddenException('Only the recipient can accept this connection request');
        }
        if (connection.status === client_1.ConnectionStatus.ACCEPTED) {
            return connection;
        }
        const updated = await this.prisma.connection.update({
            where: { id: connectionId },
            data: { status: client_1.ConnectionStatus.ACCEPTED },
        });
        await this.prisma.notification.create({
            data: {
                userId: connection.requesterId,
                type: 'CONNECTION_ACCEPTED',
                payload: { acceptedByUserId: userId, connectionId },
            },
        });
        return updated;
    }
    async rejectRequest(userId, connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection request not found');
        }
        if (connection.receiverId !== userId) {
            throw new common_1.ForbiddenException('Only the recipient can reject this request');
        }
        return await this.prisma.connection.update({
            where: { id: connectionId },
            data: { status: client_1.ConnectionStatus.REJECTED },
        });
    }
    async removeConnection(userId, connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        if (connection.requesterId !== userId && connection.receiverId !== userId) {
            throw new common_1.ForbiddenException('You cannot delete a connection you are not part of');
        }
        await this.prisma.connection.delete({
            where: { id: connectionId },
        });
        return { message: 'Connection removed successfully' };
    }
    async getAcceptedConnections(userId, pagination) {
        const where = {
            status: client_1.ConnectionStatus.ACCEPTED,
            OR: [{ requesterId: userId }, { receiverId: userId }],
        };
        const [connections, total] = await Promise.all([
            this.prisma.connection.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    requester: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profilePicUrl: true,
                            alumniDetails: true,
                            studentDetails: true,
                        },
                    },
                    receiver: {
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
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.connection.count({ where }),
        ]);
        const items = connections.map((conn) => {
            const peer = conn.requesterId === userId ? conn.receiver : conn.requester;
            return {
                connectionId: conn.id,
                connectedSince: conn.updatedAt,
                peer,
            };
        });
        return {
            items,
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
    async getPendingRequests(userId) {
        return await this.prisma.connection.findMany({
            where: {
                receiverId: userId,
                status: client_1.ConnectionStatus.PENDING,
            },
            include: {
                requester: {
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
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSentRequests(userId) {
        return await this.prisma.connection.findMany({
            where: {
                requesterId: userId,
                status: client_1.ConnectionStatus.PENDING,
            },
            include: {
                receiver: {
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
            orderBy: { createdAt: 'desc' },
        });
    }
    async areConnected(userAId, userBId) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                status: client_1.ConnectionStatus.ACCEPTED,
                OR: [
                    { requesterId: userAId, receiverId: userBId },
                    { requesterId: userBId, receiverId: userAId },
                ],
            },
        });
        if (connection)
            return true;
        const mentorship = await this.prisma.mentorshipRequest.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { studentId: userAId, mentorId: userBId },
                    { studentId: userBId, mentorId: userAId },
                ],
            },
        });
        return !!mentorship;
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map