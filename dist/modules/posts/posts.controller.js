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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const posts_dto_1 = require("./dto/posts.dto");
const posts_service_1 = require("./posts.service");
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async createPost(userId, dto) {
        return await this.postsService.createPost(userId, dto);
    }
    async getPostsFeed(query) {
        return await this.postsService.getPostsFeed(query);
    }
    async getPostById(id) {
        return await this.postsService.getPostById(id);
    }
    async deletePost(id, userId, role) {
        return await this.postsService.deletePost(id, userId, role);
    }
    async reportPost(id) {
        return await this.postsService.reportPost(id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a post (General update, Job, or Internship)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Post created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, posts_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated post & job feed' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [posts_dto_1.QueryPostsDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostsFeed", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get post by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostById", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a post (Owner or Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, swagger_1.ApiOperation)({ summary: 'Flag or report an inappropriate post' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "reportPost", null);
exports.PostsController = PostsController = __decorate([
    (0, swagger_1.ApiTags)('Posts & Jobs'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map