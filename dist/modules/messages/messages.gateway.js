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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const redis_service_1 = require("../../redis/redis.service");
const messages_dto_1 = require("./dto/messages.dto");
const messages_service_1 = require("./messages.service");
let MessagesGateway = MessagesGateway_1 = class MessagesGateway {
    constructor(messagesService, jwtService, configService, redisService) {
        this.messagesService = messagesService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(MessagesGateway_1.name);
        this.typingTimeouts = new Map();
    }
    async handleConnection(client) {
        try {
            const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
            if (!authHeader) {
                this.logger.warn(`Socket connection rejected: No auth token provided (socketId=${client.id})`);
                client.disconnect();
                return;
            }
            const token = authHeader.replace(/^Bearer\s+/i, '');
            const secret = this.configService.get('JWT_SECRET', 'alumni_super_secret_jwt_access_key_2026_x99');
            const payload = this.jwtService.verify(token, { secret });
            client.userId = payload.sub;
            const userRoom = `user:${client.userId}`;
            client.join(userRoom);
            await this.redisService.setUserOnline(client.userId, client.id);
            this.logger.log(`Socket connected: userId=${client.userId} socketId=${client.id}`);
        }
        catch (err) {
            this.logger.warn(`Socket authentication failed: ${err.message}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            const isCompletelyOffline = await this.redisService.setUserOffline(client.userId, client.id);
            this.logger.log(`Socket disconnected: userId=${client.userId} socketId=${client.id} (completelyOffline=${isCompletelyOffline})`);
        }
    }
    async handleSendMessage(client, dto) {
        if (!client.userId) {
            return { success: false, error: 'Unauthorized socket session' };
        }
        try {
            const message = await this.messagesService.sendMessage(client.userId, dto);
            this.server.to(`user:${dto.receiverId}`).emit('newMessage', message);
            return { success: true, message };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async handleMessageDelivered(client, dto) {
        if (!client.userId)
            return;
        const updated = await this.messagesService.markDelivered(dto.messageId, client.userId);
        if (updated) {
            this.server.to(`user:${updated.senderId}`).emit('messageStatusUpdate', {
                messageId: updated.id,
                status: updated.status,
            });
        }
        return { success: true };
    }
    async handleMessageRead(client, dto) {
        if (!client.userId)
            return;
        const updated = await this.messagesService.markRead(dto.messageId, client.userId);
        if (updated) {
            this.server.to(`user:${updated.senderId}`).emit('messageStatusUpdate', {
                messageId: updated.id,
                status: updated.status,
            });
        }
        return { success: true };
    }
    handleTyping(client, data) {
        if (!client.userId || !data?.receiverId)
            return;
        this.server.to(`user:${data.receiverId}`).emit('userTyping', {
            senderId: client.userId,
        });
        const timeoutKey = `${client.userId}:${data.receiverId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey));
        }
        const timeout = setTimeout(() => {
            this.server.to(`user:${data.receiverId}`).emit('userStoppedTyping', {
                senderId: client.userId,
            });
            this.typingTimeouts.delete(timeoutKey);
        }, 5000);
        this.typingTimeouts.set(timeoutKey, timeout);
    }
    handleStopTyping(client, data) {
        if (!client.userId || !data?.receiverId)
            return;
        const timeoutKey = `${client.userId}:${data.receiverId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey));
            this.typingTimeouts.delete(timeoutKey);
        }
        this.server.to(`user:${data.receiverId}`).emit('userStoppedTyping', {
            senderId: client.userId,
        });
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, messages_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageDelivered'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, messages_dto_1.MarkDeliveredDto]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleMessageDelivered", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, messages_dto_1.MarkReadDto]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleMessageRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stopTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleStopTyping", null);
exports.MessagesGateway = MessagesGateway = MessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map