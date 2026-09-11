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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimActivateDto = exports.ClaimSendOtpDto = exports.ClaimLookupDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.RefreshTokenDto = exports.ResendOtpDto = exports.VerifyOtpDto = exports.LoginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@alumni.edu or +919876543210', description: 'Registered email or mobile number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "emailOrMobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'StrongP@ssw0rd!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class VerifyOtpDto {
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@alumni.edu or +919876543210', description: 'Registered email or mobile' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "emailOrMobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: '6-digit OTP received via Email or SMS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
class ResendOtpDto {
}
exports.ResendOtpDto = ResendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@alumni.edu or +919876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "emailOrMobile", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT Refresh Token received at login/verification' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class ForgotPasswordDto {
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@alumni.edu or +919876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "emailOrMobile", void 0);
class ResetPasswordDto {
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@alumni.edu or +919876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "emailOrMobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NewStrongPassword123!', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
class ClaimLookupDto {
}
exports.ClaimLookupDto = ClaimLookupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'aarav.mehta@jecrc.ac.in or +919876543210', description: 'Pre-seeded email, mobile, or roll number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClaimLookupDto.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ALUMNI', enum: ['ALUMNI', 'STUDENT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClaimLookupDto.prototype, "role", void 0);
class ClaimSendOtpDto {
}
exports.ClaimSendOtpDto = ClaimSendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid-1234', description: 'User ID of the pre-seeded record' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClaimSendOtpDto.prototype, "userId", void 0);
class ClaimActivateDto {
}
exports.ClaimActivateDto = ClaimActivateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid-1234' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: '6-digit activation OTP' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MyNewPassword@123', minLength: 6 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Senior Software Engineer @ Google' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "headline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Google' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "company", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bengaluru' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClaimActivateDto.prototype, "city", void 0);
//# sourceMappingURL=auth.dto.js.map