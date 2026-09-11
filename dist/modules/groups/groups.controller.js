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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const discussions_dto_1 = require("../discussions/dto/discussions.dto");
const groups_dto_1 = require("./dto/groups.dto");
const groups_service_1 = require("./groups.service");
let GroupsController = class GroupsController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async createGroup(userId, dto) {
        return await this.groupsService.createGroup(userId, dto);
    }
    async getGroups(query, currentUserId) {
        return await this.groupsService.getGroups(query, currentUserId);
    }
    async getSuggestedGroups(userId) {
        return await this.groupsService.getSuggestedGroups(userId);
    }
    async joinGroup(groupId, userId) {
        return await this.groupsService.joinGroup(groupId, userId);
    }
    async leaveGroup(groupId, userId) {
        return await this.groupsService.leaveGroup(groupId, userId);
    }
    async getGroupMembers(groupId, pagination) {
        return await this.groupsService.getGroupMembers(groupId, pagination);
    }
    async getGroupDiscussions(groupId, pagination, currentUserId) {
        return await this.groupsService.getGroupDiscussions(groupId, pagination, currentUserId);
    }
    async createGroupDiscussion(groupId, userId, dto) {
        return await this.groupsService.createGroupDiscussion(groupId, userId, dto);
    }
    async updateGroup(groupId, userId, role, dto) {
        return await this.groupsService.updateGroup(groupId, userId, role, dto);
    }
    async deleteGroup(groupId, userId, role) {
        return await this.groupsService.deleteGroup(groupId, userId, role);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create an Affinity Group',
        description: 'Create a Batch group (e.g. CSE 2020) or Interest group (e.g. Startup Founders).',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Group created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, groups_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all groups (filter by type or keyword)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [groups_dto_1.QueryGroupsDto, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Get)('suggested'),
    (0, swagger_1.ApiOperation)({
        summary: 'Auto-suggested groups',
        description: 'Suggests groups matching current user batch, branch, or graduation year.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getSuggestedGroups", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join an affinity group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "joinGroup", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave an affinity group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "leaveGroup", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'List group members with pagination' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroupMembers", null);
__decorate([
    (0, common_1.Get)(':id/discussions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussions scoped to this group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroupDiscussions", null);
__decorate([
    (0, common_1.Post)(':id/discussions'),
    (0, swagger_1.ApiOperation)({ summary: 'Post a new discussion thread inside a group (members only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, discussions_dto_1.CreateThreadDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createGroupDiscussion", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update group name/description (Admin or Creator)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, groups_dto_1.UpdateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete group (Creator or Platform Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteGroup", null);
exports.GroupsController = GroupsController = __decorate([
    (0, swagger_1.ApiTags)('Affinity Groups'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map