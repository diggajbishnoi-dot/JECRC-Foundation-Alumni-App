import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OtpChannel } from '@prisma/client';
import { OtpService } from './otp.service';

/**
 * P0-003 — OTP Preview Gating Tests
 *
 * Acceptance criteria verified:
 *  1. production NEVER returns previewOtpForDev (even when email delivery fails)
 *  2. dev preview only works when NODE_ENV != production AND ALLOW_OTP_PREVIEW=true
 *  3. normal OTP flow (hash, expiry) continues to work in all environments
 */
describe('OtpService — previewOtpForDev gating', () => {
  /** Helper: build an OtpService with controlled env config */
  async function buildService(env: Record<string, string>): Promise<OtpService> {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => env[key] ?? defaultValue),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    return module.get<OtpService>(OtpService);
  }

  afterEach(() => { jest.restoreAllMocks(); });

  it('MUST NOT expose previewOtpForDev in production even when email delivery fails', async () => {
    const service = await buildService({ NODE_ENV: 'production', ALLOW_OTP_PREVIEW: 'true', RESEND_API_KEY: '' });
    const result = await service.sendOtp('user@alumni.edu', OtpChannel.EMAIL);
    expect(result.previewOtpForDev).toBeUndefined();
  });

  it('MUST NOT expose previewOtpForDev in production when email delivery succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'eid-1' }) }) as jest.Mock;
    const service = await buildService({ NODE_ENV: 'production', ALLOW_OTP_PREVIEW: 'false', RESEND_API_KEY: 'mock-key' });
    const result = await service.sendOtp('user@alumni.edu', OtpChannel.EMAIL);
    expect(result.previewOtpForDev).toBeUndefined();
  });

  it('MUST return previewOtpForDev in non-production when ALLOW_OTP_PREVIEW=true', async () => {
    const service = await buildService({ NODE_ENV: 'development', ALLOW_OTP_PREVIEW: 'true', RESEND_API_KEY: '' });
    const result = await service.sendOtp('user@alumni.edu', OtpChannel.EMAIL);
    expect(result.previewOtpForDev).toBeDefined();
    expect(typeof result.previewOtpForDev).toBe('string');
    expect(result.previewOtpForDev).toHaveLength(6);
  });

  it('MUST NOT return previewOtpForDev in non-production when ALLOW_OTP_PREVIEW is not set', async () => {
    const service = await buildService({ NODE_ENV: 'development' });
    const result = await service.sendOtp('+919876543210', OtpChannel.SMS);
    expect(result.previewOtpForDev).toBeUndefined();
  });

  it('MUST always return a valid bcrypt hash and future expiry regardless of environment', async () => {
    const service = await buildService({ NODE_ENV: 'production' });
    const before = new Date();
    const result = await service.sendOtp('+919876543210', OtpChannel.SMS);
    const diffMs = result.expiresAt.getTime() - before.getTime();
    expect(result.otpCodeHash).toMatch(/^\$2[aby]\$\d+\$/);
    expect(diffMs).toBeGreaterThan(9 * 60 * 1000);
    expect(diffMs).toBeLessThan(12 * 60 * 1000);
  });
});
