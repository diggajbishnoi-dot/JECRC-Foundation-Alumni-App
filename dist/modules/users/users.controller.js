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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const users_dto_1 = require("./dto/users.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(userId) {
        return await this.usersService.getMe(userId);
    }
    async updateMe(userId, dto) {
        return await this.usersService.updateMe(userId, dto);
    }
    async deleteMe(userId) {
        return await this.usersService.deleteAccount(userId);
    }
    async uploadProfilePicture(userId, file) {
        return await this.usersService.uploadProfilePicture(userId, file);
    }
    async savePublicKey(userId, dto) {
        return await this.usersService.savePublicKey(userId, dto);
    }
    async registerDeviceToken(userId, dto) {
        return await this.usersService.registerDeviceToken(userId, dto);
    }
    async searchUsers(query) {
        return await this.usersService.searchUsers(query);
    }
    async getPublicKey(id) {
        return await this.usersService.getPublicKey(id);
    }
    async getPresence(targetId, currentUserId) {
        return await this.usersService.getPresence(targetId, currentUserId);
    }
    async getUserById(targetId, currentUserId) {
        return await this.usersService.getUserById(targetId, currentUserId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile', description: 'Returns authenticated profile with stats' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete current user account permanently' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, common_1.Post)('me/profile-picture'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload avatar to S3' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadProfilePicture", null);
__decorate([
    (0, common_1.Post)('me/public-key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload device X25519 public key',
        description: 'Enables WhatsApp-style E2E encrypted messaging. The server stores only this public key.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UploadPublicKeyDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "savePublicKey", null);
__decorate([
    (0, common_1.Post)('me/device-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Register FCM device token for push notifications' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.RegisterDeviceTokenDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "registerDeviceToken", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search & filter directory',
        description: 'Filter students & alumni by role, branch, batch, company, or city with pagination.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [users_dto_1.SearchUsersQueryDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)(':id/public-key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Fetch recipient public key',
        description: 'Allows client device to derive shared secret and encrypt message prior to transmission.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPublicKey", null);
__decorate([
    (0, common_1.Get)(':id/presence'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get online/offline status and last seen',
        description: 'Fetches real-time status from Redis. Respects user privacy hideLastSeen flag.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPresence", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'View user profile',
        description: 'Returns profile details. Sensitive contact info is restricted to accepted connections.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users & Profiles'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map