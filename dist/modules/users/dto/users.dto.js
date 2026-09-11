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
exports.SearchUsersQueryDto = exports.RegisterDeviceTokenDto = exports.UploadPublicKeyDto = exports.UpdateProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Tech enthusiast and open source contributor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bengaluru, India' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "hideLastSeen", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Microsoft' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "currentCompany", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Principal Engineer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "designation", void 0);
class UploadPublicKeyDto {
}
exports.UploadPublicKeyDto = UploadPublicKeyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'X25519 Public Key (Base64 or Hex encoded) generated on client device for E2E encryption',
        example: 'dGhpcy1pcy1hLXZhbGlkLXgyNTUxOS1wdWJsaWMta2V5',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadPublicKeyDto.prototype, "publicKey", void 0);
class RegisterDeviceTokenDto {
}
exports.RegisterDeviceTokenDto = RegisterDeviceTokenDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Firebase Cloud Messaging (FCM) device registration token',
        example: 'fcm_token_abc_123_xyz',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDeviceTokenDto.prototype, "fcmToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Platform, default: client_1.Platform.ANDROID }),
    (0, class_validator_1.IsEnum)(client_1.Platform),
    __metadata("design:type", String)
], RegisterDeviceTokenDto.prototype, "platform", void 0);
class SearchUsersQueryDto extends pagination_dto_1.PaginationQueryDto {
}
exports.SearchUsersQueryDto = SearchUsersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rahul' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Role }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Computer Science and Engineering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "branch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2019-2023' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "batch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2023 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SearchUsersQueryDto.prototype, "passoutYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Google' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "company", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bengaluru' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersQueryDto.prototype, "city", void 0);
//# sourceMappingURL=users.dto.js.map