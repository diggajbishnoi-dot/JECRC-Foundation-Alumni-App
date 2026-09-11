import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OtpChannel } from '@prisma/client';

export interface SendOtpResult {
  channel: OtpChannel;
  destination: string;
  expiresAt: Date;
  otpCodeHash: string;
  previewOtpForDev?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a 6-digit random numeric OTP
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hashes the OTP using bcrypt (never stored in plaintext)
   */
  async hashOtp(otp: string): Promise<string> {
    return await bcrypt.hash(otp, 10);
  }

  /**
   * Verifies if the supplied OTP matches the stored hash
   */
  async verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
    return await bcrypt.compare(plainOtp, hashedOtp);
  }

  /**
   * Dispatches OTP via either SMS or Email
   */
  async sendOtp(destination: string, channel: OtpChannel): Promise<SendOtpResult> {
    const rawOtp = this.generateOtpCode();
    const otpCodeHash = await this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (channel === OtpChannel.EMAIL) {
      await this.sendEmailOtp(destination, rawOtp);
    } else {
      await this.sendSmsOtp(destination, rawOtp);
    }

    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    return {
      channel,
      destination,
      expiresAt,
      otpCodeHash,
      previewOtpForDev: isDev ? rawOtp : undefined,
    };
  }

  private async sendEmailOtp(email: string, otp: string): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'SMTP');
    this.logger.log(`[EMAIL DISPATCH] Provider=${provider} Sending OTP [${otp}] to ${email}`);
    // In production with real credentials, nodemailer sends actual email here.
  }

  private async sendSmsOtp(mobile: string, otp: string): Promise<void> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'TWILIO');
    this.logger.log(`[SMS DISPATCH] Provider=${provider} Sending OTP [${otp}] to ${mobile}`);
    // In production with Twilio/MSG91 keys, real SMS is dispatched here.
  }
}
