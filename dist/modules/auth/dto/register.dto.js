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
exports.RegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rahul Sharma', description: 'Full name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rahul@alumni.edu', description: 'Email address' }),
    (0, class_validator_1.ValidateIf)((o) => !o.mobile || o.email),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+919876543210', description: 'Mobile number with country code' }),
    (0, class_validator_1.ValidateIf)((o) => !o.email || o.mobile),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'StrongP@ssw0rd!', minLength: 6 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Role, default: client_1.Role.STUDENT }),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base64/Hex public key for E2E encryption generated on device' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Computer Science and Engineering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "branch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, description: 'Current year of study (1-5)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RegisterDto.prototype, "currentYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2027, description: 'Expected graduation year' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RegisterDto.prototype, "expectedPassoutYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Electrical Engineering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "alumniBranch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2019-2023', description: 'Batch name or year span' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "batch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2023, description: 'Graduation passout year' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RegisterDto.prototype, "passoutYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Google', description: 'Current employer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "currentCompany", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Senior Software Engineer', description: 'Job title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "designation", void 0);
//# sourceMappingURL=register.dto.js.map