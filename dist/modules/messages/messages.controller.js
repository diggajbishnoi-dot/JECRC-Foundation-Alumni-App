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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const messages_service_1 = require("./messages.service");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async getConversationHistory(currentUserId, otherUserId, pagination) {
        return await this.messagesService.getConversationHistory(currentUserId, otherUserId, pagination);
    }
    async markConversationRead(currentUserId, otherUserId) {
        return await this.messagesService.markConversationRead(currentUserId, otherUserId);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)(':userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Fetch encrypted conversation history',
        description: 'Returns paginated list of encrypted messages and nonces for local decryption on the client device.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of encrypted messages' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getConversationHistory", null);
__decorate([
    (0, common_1.Patch)(':userId/read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark conversation as read',
        description: 'Bulk marks all incoming messages from this user as READ upon opening the chat screen.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markConversationRead", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('Messages & Chat'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map