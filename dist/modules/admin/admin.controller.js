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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getUnverifiedAlumni(pagination) {
        return await this.adminService.getUnverifiedAlumni(pagination);
    }
    async verifyUser(userId) {
        return await this.adminService.verifyUser(userId);
    }
    async deletePost(postId) {
        return await this.adminService.deletePost(postId);
    }
    async deleteDiscussion(threadId) {
        return await this.adminService.deleteDiscussion(threadId);
    }
    async deleteGroup(groupId) {
        return await this.adminService.deleteGroup(groupId);
    }
    async getDashboardStats() {
        return await this.adminService.getDashboardStats();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users/unverified'),
    (0, swagger_1.ApiOperation)({ summary: 'List alumni pending verification' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unverified alumni list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUnverifiedAlumni", null);
__decorate([
    (0, common_1.Patch)('users/:id/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve alumni verification' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyUser", null);
__decorate([
    (0, common_1.Delete)('posts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove spam post' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Delete)('discussions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove spam discussion thread' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteDiscussion", null);
__decorate([
    (0, common_1.Delete)('groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove spam/inappropriate group' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteGroup", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get complete platform KPIs & analytics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Panel'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map