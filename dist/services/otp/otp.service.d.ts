import { ConfigService } from '@nestjs/config';
import { OtpChannel } from '@prisma/client';
export interface SendOtpResult {
    channel: OtpChannel;
    destination: string;
    expiresAt: Date;
    otpCodeHash: string;
    previewOtpForDev?: string;
    deliveryNotice?: string;
}
export declare class OtpService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    generateOtpCode(): string;
    hashOtp(otp: string): Promise<string>;
    verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean>;
    sendOtp(destination: string, channel: OtpChannel): Promise<SendOtpResult>;
    private sendEmailOtp;
    private sendSmsOtp;
}
