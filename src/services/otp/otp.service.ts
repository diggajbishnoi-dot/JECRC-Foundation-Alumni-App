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
  deliveryNotice?: string;
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

    let emailResult: { success: boolean; error?: string } = { success: true };
    if (channel === OtpChannel.EMAIL) {
      emailResult = await this.sendEmailOtp(destination, rawOtp);
    } else {
      await this.sendSmsOtp(destination, rawOtp);
    }

    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    // Provide preview OTP in dev, or if Resend failed/has domain restriction, or if explicitly allowed
    const shouldProvidePreview = isDev || !emailResult.success || this.configService.get<string>('ALLOW_OTP_PREVIEW') === 'true';

    return {
      channel,
      destination,
      expiresAt,
      otpCodeHash,
      previewOtpForDev: shouldProvidePreview ? rawOtp : undefined,
      deliveryNotice: emailResult.error,
    };
  }

  private async sendEmailOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    const emailFrom = this.configService.get<string>('EMAIL_FROM', 'onboarding@resend.dev');

    this.logger.log(`[EMAIL DISPATCH] Sending OTP [${otp}] to ${email}`);

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
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
          const errMsg = data?.message || JSON.stringify(data);
          this.logger.error(`[RESEND ERROR] Failed to send email: ${errMsg}`);
          return { success: false, error: errMsg };
        } else {
          this.logger.log(`[RESEND SUCCESS] Email dispatched successfully: ID=${data?.id}`);
          return { success: true };
        }
      } catch (err: any) {
        this.logger.error(`[RESEND EXCEPTION] ${err.message}`);
        return { success: false, error: err.message };
      }
    } else {
      this.logger.warn('[RESEND SKIPPED] No RESEND_API_KEY configured in environment variables.');
      return { success: false, error: 'No RESEND_API_KEY configured' };
    }
  }

  private async sendSmsOtp(mobile: string, otp: string): Promise<void> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'TWILIO');
    this.logger.log(`[SMS DISPATCH] Provider=${provider} Sending OTP [${otp}] to ${mobile}`);
  }
}
