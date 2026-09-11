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
exports.QueryGroupsDto = exports.UpdateGroupDto = exports.CreateGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class CreateGroupDto {
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bangalore Chapter - Alumni Founders' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.GroupType, default: client_1.GroupType.INTEREST }),
    (0, class_validator_1.IsEnum)(client_1.GroupType),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'A community of founders, co-founders, and early-stage entrepreneurs from our college.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "description", void 0);
class UpdateGroupDto {
}
exports.UpdateGroupDto = UpdateGroupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated Group Name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated Description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "description", void 0);
class QueryGroupsDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryGroupsDto = QueryGroupsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.GroupType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.GroupType),
    __metadata("design:type", String)
], QueryGroupsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bangalore' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryGroupsDto.prototype, "search", void 0);
//# sourceMappingURL=groups.dto.js.map