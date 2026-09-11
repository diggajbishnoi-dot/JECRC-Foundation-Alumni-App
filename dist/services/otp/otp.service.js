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
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
let OtpService = OtpService_1 = class OtpService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(OtpService_1.name);
    }
    generateOtpCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async hashOtp(otp) {
        return await bcrypt.hash(otp, 10);
    }
    async verifyOtp(plainOtp, hashedOtp) {
        return await bcrypt.compare(plainOtp, hashedOtp);
    }
    async sendOtp(destination, channel) {
        const rawOtp = this.generateOtpCode();
        const otpCodeHash = await this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        if (channel === client_1.OtpChannel.EMAIL) {
            await this.sendEmailOtp(destination, rawOtp);
        }
        else {
            await this.sendSmsOtp(destination, rawOtp);
        }
        const isDev = this.configService.get('NODE_ENV') !== 'production';
        return {
            channel,
            destination,
            expiresAt,
            otpCodeHash,
            previewOtpForDev: isDev ? rawOtp : undefined,
        };
    }
    async sendEmailOtp(email, otp) {
        const provider = this.configService.get('EMAIL_PROVIDER', 'SMTP');
        this.logger.log(`[EMAIL DISPATCH] Provider=${provider} Sending OTP [${otp}] to ${email}`);
    }
    async sendSmsOtp(mobile, otp) {
        const provider = this.configService.get('SMS_PROVIDER', 'TWILIO');
        this.logger.log(`[SMS DISPATCH] Provider=${provider} Sending OTP [${otp}] to ${mobile}`);
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map