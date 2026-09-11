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
exports.MarkReadDto = exports.MarkDeliveredDto = exports.SendMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recipient user ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "receiverId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ciphertext only - encrypted on mobile device via X25519 + AES/XSalsa20 before sending',
        example: 'dGhpcyBpcyBhbiBlbmNyeXB0ZWQgY2lwaGVydGV4dA==',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "encryptedContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Initialization vector / Nonce generated during client-side encryption',
        example: 'ubqO67k81zZp18Xz9A7n0Q==',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "nonce", void 0);
class MarkDeliveredDto {
}
exports.MarkDeliveredDto = MarkDeliveredDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MarkDeliveredDto.prototype, "messageId", void 0);
class MarkReadDto {
}
exports.MarkReadDto = MarkReadDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MarkReadDto.prototype, "messageId", void 0);
//# sourceMappingURL=messages.dto.js.map