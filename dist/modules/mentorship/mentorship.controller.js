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
exports.MentorshipController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const mentorship_dto_1 = require("./dto/mentorship.dto");
const mentorship_service_1 = require("./mentorship.service");
let MentorshipController = class MentorshipController {
    constructor(mentorshipService) {
        this.mentorshipService = mentorshipService;
    }
    async optIn(userId, role, dto) {
        return await this.mentorshipService.optInAsMentor(userId, role, dto);
    }
    async getMentors(query) {
        return await this.mentorshipService.getMentors(query);
    }
    async requestMentorship(studentId, role, dto) {
        return await this.mentorshipService.requestMentorship(studentId, role, dto);
    }
    async acceptMentorship(mentorId, requestId) {
        return await this.mentorshipService.acceptMentorship(mentorId, requestId);
    }
    async rejectMentorship(mentorId, requestId) {
        return await this.mentorshipService.rejectMentorship(mentorId, requestId);
    }
    async completeMentorship(userId, requestId) {
        return await this.mentorshipService.closeMentorship(userId, requestId, client_1.MentorshipStatus.COMPLETED);
    }
    async endMentorship(userId, requestId) {
        return await this.mentorshipService.closeMentorship(userId, requestId, client_1.MentorshipStatus.ENDED);
    }
    async getMyMentorships(userId, query) {
        return await this.mentorshipService.getMyMentorships(userId, query);
    }
};
exports.MentorshipController = MentorshipController;
__decorate([
    (0, common_1.Post)('opt-in'),
    (0, swagger_1.ApiOperation)({
        summary: 'Opt in or update mentor profile (Alumni only)',
        description: 'Allows alumni to register domains, availability, and max mentee cap.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Mentor profile updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mentorship_dto_1.MentorOptInDto]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "optIn", null);
__decorate([
    (0, common_1.Get)('mentors'),
    (0, swagger_1.ApiOperation)({ summary: 'Browse/search active mentors (filter by domain or company)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mentorship_dto_1.QueryMentorsDto]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "getMentors", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiOperation)({
        summary: 'Request mentorship from an alumni mentor (Students only)',
        description: 'Enforces mentor max mentee capacity check.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mentorship_dto_1.CreateMentorshipRequestDto]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "requestMentorship", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, swagger_1.ApiOperation)({
        summary: 'Accept mentorship request (Mentor only)',
        description: 'Unlocks one-to-one encrypted chat between student and mentor.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "acceptMentorship", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject mentorship request (Mentor only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "rejectMentorship", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark mentorship as COMPLETED' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "completeMentorship", null);
__decorate([
    (0, common_1.Patch)(':id/end'),
    (0, swagger_1.ApiOperation)({ summary: 'End mentorship relationship' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "endMentorship", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user mentorship requests (as student or mentor)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mentorship_dto_1.QueryMyMentorshipsDto]),
    __metadata("design:returntype", Promise)
], MentorshipController.prototype, "getMyMentorships", null);
exports.MentorshipController = MentorshipController = __decorate([
    (0, swagger_1.ApiTags)('Mentorship Matching'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mentorship'),
    __metadata("design:paramtypes", [mentorship_service_1.MentorshipService])
], MentorshipController);
//# sourceMappingURL=mentorship.controller.js.map