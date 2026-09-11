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
exports.QueryThreadsDto = exports.CreateReplyDto = exports.CreateThreadDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class CreateThreadDto {
}
exports.CreateThreadDto = CreateThreadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Best practices for transition from SWE to AI Engineer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThreadDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Looking for guidance on what courses, projects, and math background help most...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThreadDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Career Advice', description: 'e.g. Career Advice, Startup Ideas, Higher Studies, General' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThreadDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional affinity group ID if scoped to a group' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateThreadDto.prototype, "groupId", void 0);
class CreateReplyDto {
}
exports.CreateReplyDto = CreateReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I transitioned last year. I would strongly recommend starting with hands-on projects...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "content", void 0);
class QueryThreadsDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryThreadsDto = QueryThreadsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Career Advice' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryThreadsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AI' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryThreadsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['newest', 'upvotes'], default: 'newest' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryThreadsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryThreadsDto.prototype, "groupId", void 0);
//# sourceMappingURL=discussions.dto.js.map