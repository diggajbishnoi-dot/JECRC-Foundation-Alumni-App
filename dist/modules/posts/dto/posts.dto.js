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
exports.QueryPostsDto = exports.CreatePostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class CreatePostDto {
}
exports.CreatePostDto = CreatePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PostType, default: client_1.PostType.GENERAL }),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], CreatePostDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Software Engineer II Opening at Microsoft' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'We are hiring for our cloud infrastructure team in Bengaluru...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Microsoft' }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.PostType.JOB || o.type === client_1.PostType.INTERNSHIP),
    (0, class_validator_1.IsNotEmpty)({ message: 'Company is required for Job or Internship posts' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "company", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bengaluru, India (Hybrid)' }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.PostType.JOB || o.type === client_1.PostType.INTERNSHIP),
    (0, class_validator_1.IsNotEmpty)({ message: 'Location is required for Job or Internship posts' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://careers.microsoft.com/job/12345 or attachment url' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "attachmentUrl", void 0);
class QueryPostsDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryPostsDto = QueryPostsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bengaluru' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "location", void 0);
//# sourceMappingURL=posts.dto.js.map