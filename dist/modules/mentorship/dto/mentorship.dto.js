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
exports.QueryMyMentorshipsDto = exports.QueryMentorsDto = exports.CreateMentorshipRequestDto = exports.MentorOptInDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class MentorOptInDto {
    constructor() {
        this.maxMentees = 3;
        this.isActive = true;
    }
}
exports.MentorOptInDto = MentorOptInDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['Software Engineering', 'System Design', 'FAANG Interview Prep'],
        description: 'Domains and skills available to mentor',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MentorOptInDto.prototype, "domains", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '10+ years in distributed systems. Happy to guide on career, resume, and tech stack.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MentorOptInDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2 sessions per month (45 mins each)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MentorOptInDto.prototype, "availability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, default: 3 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MentorOptInDto.prototype, "maxMentees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MentorOptInDto.prototype, "isActive", void 0);
class CreateMentorshipRequestDto {
}
exports.CreateMentorshipRequestDto = CreateMentorshipRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target alumni mentor user ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMentorshipRequestDto.prototype, "mentorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hi! I am in 3rd year CSE preparing for backend engineering internships and would love your mentorship.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMentorshipRequestDto.prototype, "message", void 0);
class QueryMentorsDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryMentorsDto = QueryMentorsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Software Engineering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryMentorsDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Google' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryMentorsDto.prototype, "company", void 0);
class QueryMyMentorshipsDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryMyMentorshipsDto = QueryMyMentorshipsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MentorshipStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MentorshipStatus),
    __metadata("design:type", String)
], QueryMyMentorshipsDto.prototype, "status", void 0);
//# sourceMappingURL=mentorship.dto.js.map