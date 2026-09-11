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
        const resendApiKey = this.configService.get('RESEND_API_KEY');
        const emailFrom = this.configService.get('EMAIL_FROM', 'onboarding@resend.dev');
        this.logger.log(`[EMAIL DISPATCH] Sending OTP [${otp}] to ${email}`);
        if (resendApiKey) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: emailFrom,
                        to: [email],
                        subject: `${otp} is your JECRC Alumni verification code`,
                        html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E6EAF3; border-radius: 12px;">
                <h2 style="color: #0F2A5E; margin-bottom: 8px;">JECRC Foundation</h2>
                <p style="color: #555; font-size: 14px;">Your one-time verification code for the Alumni Network is:</p>
                <div style="background: #F4F6FB; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0F2A5E;">${otp}</span>
                </div>
                <p style="color: #888; font-size: 12px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `,
                    }),
                });
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    this.logger.error(`[RESEND ERROR] Failed to send email: ${JSON.stringify(data)}`);
                }
                else {
                    this.logger.log(`[RESEND SUCCESS] Email dispatched successfully: ID=${data?.id}`);
                }
            }
            catch (err) {
                this.logger.error(`[RESEND EXCEPTION] ${err.message}`);
            }
        }
        else {
            this.logger.warn('[RESEND SKIPPED] No RESEND_API_KEY configured in environment variables.');
        }
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