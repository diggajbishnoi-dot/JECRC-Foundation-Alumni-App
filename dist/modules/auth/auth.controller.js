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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const register_dto_1 = require("./dto/register.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        return await this.authService.register(dto);
    }
    async verifyOtp(dto) {
        return await this.authService.verifyOtp(dto);
    }
    async login(dto) {
        return await this.authService.login(dto);
    }
    async resendOtp(dto) {
        return await this.authService.resendOtp(dto);
    }
    async refreshTokens(dto) {
        return await this.authService.refreshTokens(dto);
    }
    async forgotPassword(dto) {
        return await this.authService.forgotPassword(dto);
    }
    async resetPassword(dto) {
        return await this.authService.resetPassword(dto);
    }
    async claimLookup(dto) {
        return await this.authService.claimLookup(dto.identifier, dto.role);
    }
    async claimSendOtp(dto) {
        return await this.authService.claimSendOtp(dto.userId);
    }
    async claimActivate(dto) {
        return await this.authService.claimActivate(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register Student or Alumni',
        description: 'Registers user with email or mobile. Dispatches a 6-digit OTP to chosen channel.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered, OTP sent' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email or Mobile already in use' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify One-Time Registration OTP',
        description: 'Permanently verifies user and immediately issues JWT access + refresh tokens. After this single verification, all future logins are normal password-based.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verified and auto-logged in' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Direct Login with Password',
        description: 'Standard email/mobile + password login for verified accounts. NO OTP re-triggered for normal logins.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful, tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Account not verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('resend-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Resend Registration OTP',
        description: 'Resends a fresh 6-digit OTP if the initial one expired before verification (rate-limited).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New OTP dispatched' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendOtp", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh Access Token',
        description: 'Rotates refresh token and returns fresh access token (15m expiration).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New tokens issued' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or revoked refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Request Password Reset OTP',
        description: 'Dispatches OTP via registered email or SMS.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reset OTP dispatched' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset Password with OTP',
        description: 'Verifies reset OTP and updates user password.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('claim-lookup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Lookup Pre-seeded Student or Alumni Record',
        description: 'Searches pre-imported college records by email or mobile to claim and activate profile.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lookup result returned' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ClaimLookupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "claimLookup", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('claim-send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Send Activation OTP for Profile Claim',
        description: 'Dispatches 6-digit OTP to pre-registered contact of the matched institutional record.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activation OTP dispatched' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ClaimSendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "claimSendOtp", null);
__decorate([
    (0, roles_decorator_1.Public)(),
    (0, common_1.Post)('claim-activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Activate Claimed Profile',
        description: 'Verifies OTP, sets user password, marks profile active, and issues login JWT tokens.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile claimed and logged in' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired activation OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ClaimActivateDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "claimActivate", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map