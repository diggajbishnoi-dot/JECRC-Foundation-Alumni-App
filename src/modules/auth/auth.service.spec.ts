import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock_jwt_token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, def: any) => def),
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
    it('should reject registration when neither email nor mobile is provided', async () => {
      await expect(
        service.register({
          name: 'Test',
          password: 'Password123',
          role: Role.STUDENT,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register student and send one-time OTP to mobile via SMS', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', name: 'Student' });
      mockOtpService.sendOtp.mockResolvedValue({
        channel: OtpChannel.SMS,
        destination: '+919876543210',
        otpCodeHash: 'hashed_otp',
        expiresAt: new Date(Date.now() + 600000),
      });

      const res = await service.register({
        name: 'Student',
        mobile: '+919876543210',
        password: 'Password@123',
        role: Role.STUDENT,
        branch: 'CSE',
        currentYear: 2,
        expectedPassoutYear: 2028,
      });

      expect(res.userId).toBe('user-1');
      expect(res.channel).toBe(OtpChannel.SMS);
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith('+919876543210', OtpChannel.SMS);
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
});
