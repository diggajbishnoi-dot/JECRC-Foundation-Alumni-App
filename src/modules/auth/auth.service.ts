import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpChannel, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OtpService } from '../../services/otp/otp.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
  ) {}

  private async runInTx<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    if (this.prisma.isMock) {
      return await fn(this.prisma);
    }
    return await this.prisma.$transaction(fn);
  }

  private async runTxArray(actions: any[]): Promise<any[]> {
    if (this.prisma.isMock) {
      return await Promise.all(actions);
    }
    return await this.prisma.$transaction(actions as any);
  }

  /**
   * Register a new Student or Alumni
   * Sends a one-time OTP to Email
   */
  async register(dto: RegisterDto) {
    if (!dto.email) {
      throw new BadRequestException('Email address is required for registration and OTP verification');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanMobile = dto.mobile ? dto.mobile.trim() : undefined;
    const cleanName = dto.name
      .trim()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');

    const channel = OtpChannel.EMAIL;
    const destination = cleanEmail;

    // Check existing users (strictly 1 account per email/mobile)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: dto.email.trim() },
          ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User already exists. An account with this email is already registered. Please sign in instead.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and details in a transaction
    const user = await this.runInTx(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile || null,
          passwordHash,
          role: dto.role,
          isVerified: false,
          publicKey: dto.publicKey || null,
        },
      });

      if (dto.role === Role.STUDENT) {
        await tx.studentDetails.create({
          data: {
            userId: newUser.id,
            branch: dto.branch || 'CSE',
            currentYear: dto.currentYear || 3,
            expectedPassoutYear: dto.expectedPassoutYear || 2028,
          },
        });
      } else if (dto.role === Role.ALUMNI) {
        await tx.alumniDetails.create({
          data: {
            userId: newUser.id,
            branch: dto.alumniBranch || dto.branch || 'General',
            batch: dto.batch || '2020',
            passoutYear: dto.passoutYear || 2020,
            currentCompany: dto.currentCompany || 'JECRC Alumni',
            designation: dto.designation || 'Alumnus',
          },
        });
      }

      return newUser;
    });

    // Generate and send OTP via Email
    const otpResult = await this.otpService.sendOtp(destination, channel);

    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCodeHash: otpResult.otpCodeHash,
        channel,
        expiresAt: otpResult.expiresAt,
      },
    });

    return {
      userId: user.id,
      channel,
      destination,
      message: `Registration successful. One-time verification OTP sent via EMAIL to ${cleanEmail}.`,
      previewOtpForDev: otpResult.previewOtpForDev,
    };
  }

  /**
   * Verify One-Time Registration OTP
   * Once verified, User.isVerified = true, and direct login is unlocked forever.
   * Auto-issues JWT access and refresh tokens.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user) {
      throw new NotFoundException('No account found with this contact');
    }

    // Brute-force protection: block after 5 failed attempts within the OTP window
    const bruteKey = `otp_attempts:${user.id}`;
    const OTP_MAX_ATTEMPTS = 5;
    const OTP_WINDOW_SECONDS = 600; // matches 10-minute OTP expiry
    const failedAttempts = await this.redisService.getFailedAttempts(bruteKey);
    if (failedAttempts >= OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many incorrect OTP attempts. Please request a new OTP and try again.',
      );
    }

    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('No active OTP found or OTP has expired. Please request a new OTP.');
    }

    const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
    if (!isValid) {
      await this.redisService.incrementFailedAttempts(bruteKey, OTP_WINDOW_SECONDS);
      throw new BadRequestException('Invalid OTP entered');
    }

    // Correct OTP — clear attempt counter before proceeding
    await this.redisService.resetFailedAttempts(bruteKey);

    // Mark user verified and remove OTP record
    const [updatedUser] = await this.runTxArray([
      this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
      this.prisma.otpVerification.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    // Issue tokens for instant auto-login
    const tokens = await this.generateTokens(updatedUser);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Account verified successfully. Welcome to Alumni Network!',
      user: this.sanitizeUser(updatedUser),
      tokens,
    };
  }

  /**
   * Standard Login (Email or Mobile + Password)
   * Direct password-only login for all verified users. NO OTP repeated!
   */
  async login(dto: LoginDto) {
    const rateLimitKey = `ratelimit:login:${dto.emailOrMobile}`;
    const allowed = await this.redisService.checkRateLimit(rateLimitKey, 10, 60);
    if (!allowed) {
      throw new ForbiddenException('Too many login attempts. Please try again in a minute.');
    }

    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user) {
      throw new UnauthorizedException('No account found with this email address. Please check your email or sign up.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Please check your password and try again.');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account is not yet verified. Please verify the one-time registration OTP sent to your email.',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Logout user by revoking active refresh token session
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Successfully logged out' };
  }

  /**
   * Resend OTP if expired during registration
   */
  async resendOtp(dto: ResendOtpDto) {
    const rateLimitKey = `ratelimit:resend_otp:${dto.emailOrMobile}`;
    const allowed = await this.redisService.checkRateLimit(rateLimitKey, 3, 300);
    if (!allowed) {
      throw new ForbiddenException('Please wait 5 minutes before requesting another OTP');
    }

    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified. You can log in directly with your password.');
    }

    if (!user.email) {
      throw new BadRequestException('No registered email address found for this user account.');
    }

    const channel = OtpChannel.EMAIL;
    const destination = user.email;

    const otpResult = await this.otpService.sendOtp(destination, channel);

    // Expire older OTPs
    await this.prisma.otpVerification.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCodeHash: otpResult.otpCodeHash,
        channel,
        expiresAt: otpResult.expiresAt,
      },
    });

    return {
      message: `New OTP sent via EMAIL to ${user.email}`,
      previewOtpForDev: otpResult.previewOtpForDev,
    };
  }

  /**
   * Refresh Access Token with token rotation
   */
  async refreshTokens(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Access denied: token has been revoked');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { tokens };
  }

  /**
   * Forgot Password - triggers OTP to verified email
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user || !user.email) {
      // Don't reveal user existence
      return { message: 'If an account exists, a reset code has been dispatched.' };
    }

    const channel = OtpChannel.EMAIL;
    const destination = user.email;
    const otpResult = await this.otpService.sendOtp(destination, channel);

    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCodeHash: otpResult.otpCodeHash,
        channel,
        expiresAt: otpResult.expiresAt,
      },
    });

    return {
      message: 'Password reset OTP has been sent to your email.',
      previewOtpForDev: otpResult.previewOtpForDev,
    };
  }

  /**
   * Reset Password with OTP
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    // Brute-force protection: block after 5 failed attempts within the OTP window
    const bruteKey = `otp_attempts:${user.id}`;
    const OTP_MAX_ATTEMPTS = 5;
    const OTP_WINDOW_SECONDS = 600;
    const failedAttempts = await this.redisService.getFailedAttempts(bruteKey);
    if (failedAttempts >= OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many incorrect OTP attempts. Please request a new reset code and try again.',
      );
    }

    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('No active OTP found or it has expired');
    }

    const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
    if (!isValid) {
      await this.redisService.incrementFailedAttempts(bruteKey, OTP_WINDOW_SECONDS);
      throw new BadRequestException('Invalid OTP code');
    }

    // Correct OTP — clear attempt counter
    await this.redisService.resetFailedAttempts(bruteKey);

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.runTxArray([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          refreshTokenHash: null, // Revoke all sessions
        },
      }),
      this.prisma.otpVerification.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'Password has been successfully updated. You can now login.' };
  }

  /**
   * Look up pre-seeded institutional record for Alumni or Student
   */
  async claimLookup(identifier: string, role?: string, clientIp?: string) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const ipKey = clientIp ? `ratelimit:claim_lookup:ip:${clientIp}` : null;
    const idKey = cleanId ? `ratelimit:claim_lookup:id:${cleanId}` : null;

    // Stricter rate limit: 10 requests per 60 seconds (1 minute window) to prevent account enumeration
    const MAX_LOOKUPS = 10;
    const WINDOW_SECONDS = 60;

    if (ipKey) {
      const allowedIp = await this.redisService.checkRateLimit(ipKey, MAX_LOOKUPS, WINDOW_SECONDS);
      if (!allowedIp) {
        throw new HttpException(
          'Too many claim lookup requests from this IP address. Please try again in a few minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (idKey) {
      const allowedId = await this.redisService.checkRateLimit(idKey, MAX_LOOKUPS, WINDOW_SECONDS);
      if (!allowedId) {
        throw new HttpException(
          'Too many claim lookup requests for this record. Please try again in a few minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }],
      },
      include: {
        studentDetails: true,
        alumniDetails: true,
      },
    });

    if (!user) {
      return {
        found: false,
        message: 'No pre-existing college record found with this email/mobile. You can create a new account via Sign up.',
      };
    }

    const branch = user.alumniDetails?.branch || user.studentDetails?.branch || 'CSE';
    const batch = user.alumniDetails?.batch || (user.studentDetails ? String(user.studentDetails.expectedPassoutYear) : '2026');
    const company = user.alumniDetails?.currentCompany || (user.role === Role.STUDENT ? 'Student' : 'Alumnus');

    const maskEmail = (em?: string | null) => {
      if (!em) return '';
      const [u, d] = em.split('@');
      if (!d) return em;
      if (u.length <= 2) return `${u[0]}***@${d}`;
      return `${u.slice(0, 2)}***@${d}`;
    };

    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        maskedEmail: maskEmail(user.email),
        role: user.role,
        branch,
        batch,
        company,
        city: user.city || 'Jaipur',
        isClaimed: user.isVerified,
      },
    };
  }

  /**
   * Send activation OTP to claim a profile via Email
   */
  async claimSendOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User record not found');
    }

    if (!user.email) {
      throw new BadRequestException('No email address registered for this institutional profile');
    }

    const destination = user.email;
    const channel = OtpChannel.EMAIL;

    const otpResult = await this.otpService.sendOtp(destination, channel);

    await this.prisma.otpVerification.deleteMany({ where: { userId: user.id } });
    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCodeHash: otpResult.otpCodeHash,
        channel,
        expiresAt: otpResult.expiresAt,
      },
    });

    return {
      success: true,
      destination,
      channel,
      message: `Activation code sent to ${destination}`,
      previewOtpForDev: otpResult.previewOtpForDev,
    };
  }

  /**
   * Verify activation OTP, set password, mark verified, issue JWT tokens
   */
  async claimActivate(dto: { userId: string; otp: string; newPassword: string; headline?: string; company?: string; city?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { studentDetails: true, alumniDetails: true },
    });
    if (!user) {
      throw new NotFoundException('User record not found');
    }

    // Brute-force protection: block after 5 failed attempts within the OTP window
    const bruteKey = `otp_attempts:${user.id}`;
    const OTP_MAX_ATTEMPTS = 5;
    const OTP_WINDOW_SECONDS = 600;
    const failedAttempts = await this.redisService.getFailedAttempts(bruteKey);
    if (failedAttempts >= OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many incorrect OTP attempts. Please request a new activation code and try again.',
      );
    }

    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('No active OTP found or code has expired');
    }

    const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
    if (!isValid) {
      await this.redisService.incrementFailedAttempts(bruteKey, OTP_WINDOW_SECONDS);
      throw new BadRequestException('Invalid activation OTP code');
    }

    // Correct OTP — clear attempt counter
    await this.redisService.resetFailedAttempts(bruteKey);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    const [updatedUser] = await this.runTxArray([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          isVerified: true,
          city: dto.city || user.city,
          bio: dto.headline || user.bio,
        },
        include: { studentDetails: true, alumniDetails: true },
      }),
      this.prisma.otpVerification.deleteMany({ where: { userId: user.id } }),
    ]);

    if (dto.company && updatedUser.alumniDetails) {
      await this.prisma.alumniDetails.update({
        where: { userId: user.id },
        data: { currentCompany: dto.company },
      });
    }

    const tokens = await this.generateTokens(updatedUser);
    await this.updateRefreshToken(updatedUser.id, tokens.refreshToken);

    return {
      tokens,
      user: this.sanitizeUser(updatedUser),
      message: 'Profile claimed and activated successfully!',
    };
  }

  // Helper methods
  private async findUserByEmailOrMobile(identifier: string): Promise<User | null> {
    const clean = identifier ? identifier.trim() : '';
    const cleanLower = clean.toLowerCase();
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanLower },
          { email: clean },
          { mobile: clean },
        ],
      },
      include: {
        studentDetails: true,
        alumniDetails: true,
      },
    });
  }

  private async generateTokens(user: User) {
    const accessSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
