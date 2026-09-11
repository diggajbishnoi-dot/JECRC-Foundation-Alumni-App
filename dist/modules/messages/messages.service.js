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
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const fcm_service_1 = require("../../services/fcm/fcm.service");
const connections_service_1 = require("../connections/connections.service");
let MessagesService = MessagesService_1 = class MessagesService {
    constructor(prisma, connectionsService, redisService, fcmService) {
        this.prisma = prisma;
        this.connectionsService = connectionsService;
        this.redisService = redisService;
        this.fcmService = fcmService;
        this.logger = new common_1.Logger(MessagesService_1.name);
    }
    async sendMessage(senderId, dto) {
        const isConnected = await this.connectionsService.areConnected(senderId, dto.receiverId);
        if (!isConnected) {
            throw new common_1.ForbiddenException('Messaging is restricted to accepted connections or active mentorship partners.');
        }
        const nonce = dto.nonce || Buffer.from(Date.now().toString()).toString('base64');
        const message = await this.prisma.message.create({
            data: {
                senderId,
                receiverId: dto.receiverId,
                encryptedContent: dto.encryptedContent,
                nonce,
                status: client_1.MessageStatus.SENT,
            },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                encryptedContent: true,
                nonce: true,
                status: true,
                createdAt: true,
            },
        });
        this.logger.log(`[MESSAGE RELAY] id=${message.id} sender=${senderId} receiver=${dto.receiverId} timestamp=${message.createdAt.toISOString()}`);
        const isReceiverOnline = await this.redisService.isUserOnline(dto.receiverId);
        if (!isReceiverOnline) {
            const sender = await this.prisma.user.findUnique({
                where: { id: senderId },
                select: { name: true },
            });
            const tokens = await this.prisma.deviceToken.findMany({
                where: { userId: dto.receiverId },
                select: { fcmToken: true },
            });
            if (tokens.length > 0) {
                await this.fcmService.sendToDeviceTokens(tokens.map((t) => t.fcmToken), {
                    title: 'New Message',
                    body: `New message from ${sender?.name || 'an alumni connection'}`,
                    data: {
                        senderId,
                        messageId: message.id,
                        type: 'CHAT_MESSAGE',
                    },
                });
            }
        }
        return message;
    }
    async markDelivered(messageId, receiverId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.receiverId !== receiverId) {
            return null;
        }
        if (message.status === client_1.MessageStatus.READ) {
            return message;
        }
        return await this.prisma.message.update({
            where: { id: messageId },
            data: { status: client_1.MessageStatus.DELIVERED },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                status: true,
                updatedAt: true,
            },
        });
    }
    async markRead(messageId, receiverId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.receiverId !== receiverId) {
            return null;
        }
        return await this.prisma.message.update({
            where: { id: messageId },
            data: { status: client_1.MessageStatus.READ },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                status: true,
                updatedAt: true,
            },
        });
    }
    async markConversationRead(currentUserId, otherUserId) {
        const res = await this.prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: currentUserId,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            data: { status: client_1.MessageStatus.READ },
        });
        return { updatedCount: res.count };
    }
    async getConversationHistory(currentUserId, otherUserId, pagination) {
        const isConnected = await this.connectionsService.areConnected(currentUserId, otherUserId);
        if (!isConnected) {
            throw new common_1.ForbiddenException('You cannot access chat history with this user');
        }
        const where = {
            OR: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId },
            ],
        };
        await this.prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: currentUserId,
                status: client_1.MessageStatus.SENT,
            },
            data: { status: client_1.MessageStatus.DELIVERED },
        });
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    senderId: true,
                    receiverId: true,
                    encryptedContent: true,
                    nonce: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.message.count({ where }),
        ]);
        return {
            items: messages.reverse(),
            meta: {
                total,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(total / (pagination.limit || 20)),
            },
        };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        connections_service_1.ConnectionsService,
        redis_service_1.RedisService,
        fcm_service_1.FcmService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map