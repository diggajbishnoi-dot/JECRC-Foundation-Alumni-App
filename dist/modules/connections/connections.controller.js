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
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const connections_service_1 = require("./connections.service");
const connections_dto_1 = require("./dto/connections.dto");
let ConnectionsController = class ConnectionsController {
    constructor(connectionsService) {
        this.connectionsService = connectionsService;
    }
    async sendRequest(requesterId, dto) {
        return await this.connectionsService.sendRequest(requesterId, dto.receiverId);
    }
    async acceptRequest(userId, connectionId) {
        return await this.connectionsService.acceptRequest(userId, connectionId);
    }
    async rejectRequest(userId, connectionId) {
        return await this.connectionsService.rejectRequest(userId, connectionId);
    }
    async removeConnection(userId, connectionId) {
        return await this.connectionsService.removeConnection(userId, connectionId);
    }
    async getAcceptedConnections(userId, query) {
        return await this.connectionsService.getAcceptedConnections(userId, query);
    }
    async getPendingRequests(userId) {
        return await this.connectionsService.getPendingRequests(userId);
    }
    async getSentRequests(userId) {
        return await this.connectionsService.getSentRequests(userId);
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a connection request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Request sent' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, connections_dto_1.SendConnectionRequestDto]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sendRequest", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a pending connection request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending connection request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove or disconnect an existing connection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "removeConnection", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List accepted connections with pagination' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getAcceptedConnections", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'List incoming pending connection requests' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)('sent'),
    (0, swagger_1.ApiOperation)({ summary: 'List outgoing pending connection requests' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getSentRequests", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, swagger_1.ApiTags)('Connections'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('connections'),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map