import { BadRequestException, ConflictException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OtpChannel, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OtpService } from '../../services/otp/otp.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let otpService: OtpService;
  let redisService: RedisService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studentDetails: { create: jest.fn() },
    alumniDetails: { create: jest.fn() },
    otpVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.all(callback);
    }),
  };

  const mockOtpService = {
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    hashOtp: jest.fn(),
  };

  const mockRedisService = {
    checkRateLimit: jest.fn().mockResolvedValue(true),
    getFailedAttempts: jest.fn().mockResolvedValue(0),
    incrementFailedAttempts: jest.fn().mockResolvedValue(1),
    resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock_jwt_token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, def: any) => def),
    getOrThrow: jest.fn((key: string) => {
      const testValues: Record<string, string> = {
        JWT_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      if (key in testValues) return testValues[key];
      throw new Error(`Missing required env var: ${key}`);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OtpService, useValue: mockOtpService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    redisService = module.get<RedisService>(RedisService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('Registration & One-Time OTP Flow', () => {
    it('should reject registration when email is not provided', async () => {
      await expect(
        service.register({
          name: 'Test',
          password: 'Password123',
          role: Role.STUDENT,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register student and send one-time OTP via EMAIL', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', name: 'Student', email: 'student@edu.com' });
      mockOtpService.sendOtp.mockResolvedValue({
        channel: OtpChannel.EMAIL,
        destination: 'student@edu.com',
        otpCodeHash: 'hashed_otp',
        expiresAt: new Date(Date.now() + 600000),
      });

      const res = await service.register({
        name: 'Student',
        email: 'student@edu.com',
        password: 'Password@123',
        role: Role.STUDENT,
        branch: 'CSE',
        currentYear: 2,
        expectedPassoutYear: 2028,
      });

      expect(res.userId).toBe('user-1');
      expect(res.channel).toBe(OtpChannel.EMAIL);
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith('student@edu.com', OtpChannel.EMAIL);
    });

    it('should verify OTP, set isVerified=true, delete OTP record, and auto-issue JWT tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@edu.com',
        isVerified: false,
        role: Role.STUDENT,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-1',
        userId: 'user-1',
        otpCodeHash: 'hashed_code',
      });
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isVerified: true });

      const res = await service.verifyOtp({
        emailOrMobile: 'user@edu.com',
        otp: '123456',
      });

      expect(res.user.isVerified).toBe(true);
      expect(res.tokens.accessToken).toBe('mock_jwt_token');
    });

    it('should allow direct login with password without OTP once verified', async () => {
      const passwordHash = await bcrypt.hash('SecretPass123', 10);
      const verifiedUser = {
        id: 'user-verified',
        email: 'verified@alumni.edu',
        passwordHash,
        isVerified: true,
        role: Role.ALUMNI,
      };

      mockPrisma.user.findFirst.mockResolvedValue(verifiedUser);
      mockPrisma.user.update.mockResolvedValue(verifiedUser);

      const res = await service.login({
        emailOrMobile: 'verified@alumni.edu',
        password: 'SecretPass123',
      });

      expect(res.message).toBe('Login successful');
      expect(res.tokens.accessToken).toBe('mock_jwt_token');
      // No OTP requested on normal login!
      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });

    it('should block login if account has not verified one-time registration OTP', async () => {
      const passwordHash = await bcrypt.hash('SecretPass123', 10);
      const unverifiedUser = {
        id: 'user-unverified',
        email: 'unverified@alumni.edu',
        passwordHash,
        isVerified: false,
        role: Role.STUDENT,
      };

      mockPrisma.user.findFirst.mockResolvedValue(unverifiedUser);

      await expect(
        service.login({
          emailOrMobile: 'unverified@alumni.edu',
          password: 'SecretPass123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('OTP Brute-Force Protection', () => {
    const baseUser = {
      id: 'user-bf',
      email: 'bf@alumni.edu',
      isVerified: false,
      role: Role.STUDENT,
    };
    const hashedOtp = { id: 'otp-1', userId: 'user-bf', otpCodeHash: 'hashed_otp' };

    beforeEach(() => {
      mockPrisma.user.findFirst.mockResolvedValue(baseUser);
      mockPrisma.otpVerification.findFirst.mockResolvedValue(hashedOtp);
      mockOtpService.verifyOtp.mockResolvedValue(false); // wrong OTP by default
      mockRedisService.getFailedAttempts.mockResolvedValue(0);
      mockRedisService.incrementFailedAttempts.mockResolvedValue(1);
      mockRedisService.resetFailedAttempts.mockResolvedValue(undefined);
    });

    it('should allow verifyOtp when no previous failed attempts', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...baseUser, isVerified: true });
      mockPrisma.otpVerification.deleteMany.mockResolvedValue({ count: 1 });
      mockRedisService.getFailedAttempts.mockResolvedValue(0);

      const res = await service.verifyOtp({ emailOrMobile: 'bf@alumni.edu', otp: '123456' });
      expect(res.user.isVerified).toBe(true);
    });

    it('should increment failed-attempt counter on wrong OTP', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(false);
      mockRedisService.getFailedAttempts.mockResolvedValue(0);

      await expect(
        service.verifyOtp({ emailOrMobile: 'bf@alumni.edu', otp: '000000' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockRedisService.incrementFailedAttempts).toHaveBeenCalledWith(
        'otp_attempts:user-bf',
        600,
      );
    });

    it('should block verifyOtp after 5 failed attempts', async () => {
      mockRedisService.getFailedAttempts.mockResolvedValue(5);

      await expect(
        service.verifyOtp({ emailOrMobile: 'bf@alumni.edu', otp: '000000' }),
      ).rejects.toThrow(ForbiddenException);

      // Must not attempt bcrypt comparison when blocked
      expect(mockOtpService.verifyOtp).not.toHaveBeenCalled();
      // Must not increment further (already blocked)
      expect(mockRedisService.incrementFailedAttempts).not.toHaveBeenCalled();
    });

    it('should reset the failed-attempt counter after a correct OTP', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...baseUser, isVerified: true });
      mockPrisma.otpVerification.deleteMany.mockResolvedValue({ count: 1 });
      mockRedisService.getFailedAttempts.mockResolvedValue(3);

      await service.verifyOtp({ emailOrMobile: 'bf@alumni.edu', otp: '123456' });

      expect(mockRedisService.resetFailedAttempts).toHaveBeenCalledWith('otp_attempts:user-bf');
    });

    it('should protect resetPassword: block after 5 failed attempts', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...baseUser, isVerified: true });
      mockRedisService.getFailedAttempts.mockResolvedValue(5);

      await expect(
        service.resetPassword({
          emailOrMobile: 'bf@alumni.edu',
          otp: '000000',
          newPassword: 'NewPass@123',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockOtpService.verifyOtp).not.toHaveBeenCalled();
    });

    it('should protect resetPassword: increment counter on wrong OTP', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...baseUser, isVerified: true });
      mockOtpService.verifyOtp.mockResolvedValue(false);
      mockRedisService.getFailedAttempts.mockResolvedValue(2);

      await expect(
        service.resetPassword({
          emailOrMobile: 'bf@alumni.edu',
          otp: '000000',
          newPassword: 'NewPass@123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockRedisService.incrementFailedAttempts).toHaveBeenCalledWith(
        'otp_attempts:user-bf',
        600,
      );
    });

    it('should use independent counters for different users', async () => {
      const userA = { id: 'user-a', email: 'a@alumni.edu', isVerified: false, role: Role.STUDENT };
      const userB = { id: 'user-b', email: 'b@alumni.edu', isVerified: false, role: Role.STUDENT };

      // User A is blocked
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(userA)
        .mockResolvedValueOnce(userB);
      mockRedisService.getFailedAttempts
        .mockResolvedValueOnce(5)  // user-a: blocked
        .mockResolvedValueOnce(0); // user-b: clear
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...userB, isVerified: true });
      mockPrisma.otpVerification.deleteMany.mockResolvedValue({ count: 1 });

      // User A should be blocked
      await expect(
        service.verifyOtp({ emailOrMobile: 'a@alumni.edu', otp: '123456' }),
      ).rejects.toThrow(ForbiddenException);

      // User B should succeed
      const res = await service.verifyOtp({ emailOrMobile: 'b@alumni.edu', otp: '123456' });
      expect(res.user.isVerified).toBe(true);
    });
  });

  describe('claimLookup Privacy Gating (P1-003)', () => {
    it('should NOT expose unmasked full email address in lookup response', async () => {
      const mockUser = {
        id: 'user-claim-1',
        name: 'Aarav Mehta',
        email: 'aarav.mehta@jecrc.ac.in',
        role: Role.ALUMNI,
        city: 'Jaipur',
        isVerified: false,
        alumniDetails: {
          branch: 'ECE',
          batch: '2022',
          currentCompany: 'TCS',
        },
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const res = await service.claimLookup('aarav.mehta@jecrc.ac.in');

      expect(res.found).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user.maskedEmail).toBe('aa***@jecrc.ac.in');
      expect((res.user as any).email).toBeUndefined(); // Full unmasked email MUST NOT be present
      expect((res.user as any).passwordHash).toBeUndefined();
      expect((res.user as any).refreshTokenHash).toBeUndefined();
    });

    it('should return found=false when no user record matches identifier', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await service.claimLookup('nonexistent@jecrc.ac.in');

      expect(res.found).toBe(false);
      expect(res.user).toBeUndefined();
      expect(res.message).toContain('No pre-existing college record found');
    });

    it('should enforce rate limiting on claimLookup when request limit is exceeded (P2-004)', async () => {
      mockRedisService.checkRateLimit.mockResolvedValue(false);

      await expect(
        service.claimLookup('spammer@jecrc.ac.in', undefined, '10.0.0.1'),
      ).rejects.toThrow(HttpException);
    });

    it('should allow claimLookup when request rate is under limit threshold (P2-004)', async () => {
      mockRedisService.checkRateLimit.mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await service.claimLookup('legit@jecrc.ac.in', undefined, '10.0.0.1');

      expect(res.found).toBe(false);
      expect(mockRedisService.checkRateLimit).toHaveBeenCalledWith(
        'ratelimit:claim_lookup:ip:10.0.0.1',
        10,
        60,
      );
    });
  });

  describe('Logout & Session Revocation (P1-004)', () => {
    it('should nullify user refreshTokenHash in database on logout', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'user-logged-out', refreshTokenHash: null });

      const res = await service.logout('user-logged-out');

      expect(res.message).toBe('Successfully logged out');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-logged-out' },
        data: { refreshTokenHash: null },
      });
    });

    it('should reject refreshTokens request after user has logged out', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-logged-out' });
      // User record after logout has refreshTokenHash = null
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-logged-out',
        refreshTokenHash: null,
      });

      await expect(
        service.refreshTokens({ refreshToken: 'mock_valid_signed_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Configurable JWT Expiration (P2-003)', () => {
    it('should pass configured JWT expiration times to signAsync when custom env values exist', async () => {
      mockConfigService.get.mockImplementation((key: string, def: any) => {
        if (key === 'JWT_ACCESS_EXPIRATION') return '30m';
        if (key === 'JWT_REFRESH_EXPIRATION') return '14d';
        return def;
      });

      mockJwtService.verify.mockReturnValue({ sub: 'user_jwt_exp_test' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_jwt_exp_test',
        email: 'test@jecrc.ac.in',
        refreshTokenHash: await bcrypt.hash('valid_refresh_token', 10),
      });

      await service.refreshTokens({ refreshToken: 'valid_refresh_token' });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expiresIn: '30m' }),
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expiresIn: '14d' }),
      );
    });

    it('should fallback to 15m and 7d defaults when custom env values are absent', async () => {
      mockConfigService.get.mockImplementation((_key: string, def: any) => def);

      mockJwtService.verify.mockReturnValue({ sub: 'user_jwt_exp_test_default' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_jwt_exp_test_default',
        email: 'default@jecrc.ac.in',
        refreshTokenHash: await bcrypt.hash('valid_refresh_token_def', 10),
      });

      await service.refreshTokens({ refreshToken: 'valid_refresh_token_def' });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expiresIn: '15m' }),
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expiresIn: '7d' }),
      );
    });
  });
});
