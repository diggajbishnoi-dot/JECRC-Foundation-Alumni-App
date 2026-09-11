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
exports.DiscussionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const discussions_service_1 = require("./discussions.service");
const discussions_dto_1 = require("./dto/discussions.dto");
let DiscussionsController = class DiscussionsController {
    constructor(discussionsService) {
        this.discussionsService = discussionsService;
    }
    async createThread(userId, dto) {
        return await this.discussionsService.createThread(userId, dto);
    }
    async getThreads(query, currentUserId) {
        return await this.discussionsService.getThreads(query, currentUserId);
    }
    async getThreadById(id, currentUserId) {
        return await this.discussionsService.getThreadById(id, currentUserId);
    }
    async getThreadReplies(threadId, pagination, currentUserId) {
        return await this.discussionsService.getThreadReplies(threadId, pagination, currentUserId);
    }
    async createReply(threadId, userId, dto) {
        return await this.discussionsService.createReply(threadId, userId, dto);
    }
    async toggleThreadUpvote(threadId, userId) {
        return await this.discussionsService.toggleThreadUpvote(threadId, userId);
    }
    async toggleReplyUpvote(replyId, userId) {
        return await this.discussionsService.toggleReplyUpvote(replyId, userId);
    }
    async deleteThread(id, userId, role) {
        return await this.discussionsService.deleteThread(id, userId, role);
    }
    async deleteReply(threadId, replyId, userId, role) {
        return await this.discussionsService.deleteReply(replyId, userId, role);
    }
    async reportThread(id) {
        return await this.discussionsService.reportThread(id);
    }
};
exports.DiscussionsController = DiscussionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new discussion thread' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Thread created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, discussions_dto_1.CreateThreadDto]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "createThread", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated discussion threads (filter by category, sort by newest/upvotes)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [discussions_dto_1.QueryThreadsDto, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getThreads", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussion thread details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getThreadById", null);
__decorate([
    (0, common_1.Get)(':id/replies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated replies for a thread' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getThreadReplies", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a reply to a discussion thread' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, discussions_dto_1.CreateReplyDto]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "createReply", null);
__decorate([
    (0, common_1.Post)(':id/upvote'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle upvote on a discussion thread' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "toggleThreadUpvote", null);
__decorate([
    (0, common_1.Post)(':id/replies/:replyId/upvote'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle upvote on a reply' }),
    __param(0, (0, common_1.Param)('replyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "toggleReplyUpvote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete thread (Owner or Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "deleteThread", null);
__decorate([
    (0, common_1.Delete)(':id/replies/:replyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete reply (Owner or Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('replyId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "deleteReply", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, swagger_1.ApiOperation)({ summary: 'Flag or report a thread' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "reportThread", null);
exports.DiscussionsController = DiscussionsController = __decorate([
    (0, swagger_1.ApiTags)('Discussions & Idea Board'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('discussions'),
    __metadata("design:paramtypes", [discussions_service_1.DiscussionsService])
], DiscussionsController);
//# sourceMappingURL=discussions.controller.js.map