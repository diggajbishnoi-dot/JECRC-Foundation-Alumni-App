import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  /**
   * Register a new Student or Alumni
   * Sends a one-time OTP to Email or Mobile
   */
  async register(dto: RegisterDto) {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('At least one of email or mobile number must be provided');
    }

    // Check existing users
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    if (dto.mobile) {
      const existingMobile = await this.prisma.user.findUnique({
        where: { mobile: dto.mobile },
      });
      if (existingMobile) {
        throw new ConflictException('An account with this mobile number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Determine OTP delivery channel: prefer mobile SMS if provided, else Email
    const channel = dto.mobile ? OtpChannel.SMS : OtpChannel.EMAIL;
    const destination = dto.mobile || dto.email!;

    // Create user and details in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email || null,
          mobile: dto.mobile || null,
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
            branch: dto.branch!,
            currentYear: dto.currentYear!,
            expectedPassoutYear: dto.expectedPassoutYear!,
          },
        });
      } else if (dto.role === Role.ALUMNI) {
        await tx.alumniDetails.create({
          data: {
            userId: newUser.id,
            branch: dto.alumniBranch || dto.branch || 'General',
            batch: dto.batch!,
            passoutYear: dto.passoutYear!,
            currentCompany: dto.currentCompany!,
            designation: dto.designation!,
          },
        });
      }

      return newUser;
    });

    // Generate and send OTP
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
      message: `Registration successful. One-time verification OTP sent via ${channel}.`,
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
      throw new BadRequestException('Invalid OTP entered');
    }

    // Mark user verified and remove OTP record
    const [updatedUser] = await this.prisma.$transaction([
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
      throw new UnauthorizedException('Invalid email/mobile or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email/mobile or password');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account is not yet verified. Please verify the one-time registration OTP sent to your contact.',
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

    const channel = user.mobile ? OtpChannel.SMS : OtpChannel.EMAIL;
    const destination = user.mobile || user.email!;

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
      message: `New OTP sent via ${channel}`,
      previewOtpForDev: otpResult.previewOtpForDev,
    };
  }

  /**
   * Refresh Access Token with token rotation
   */
  async refreshTokens(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'alumni_super_secret_jwt_refresh_key_2026_z88',
    );

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
   * Forgot Password - triggers OTP to verified channel
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
    if (!user) {
      // Don't reveal user existence
      return { message: 'If an account exists, a reset code has been dispatched.' };
    }

    const channel = user.mobile ? OtpChannel.SMS : OtpChannel.EMAIL;
    const destination = user.mobile || user.email!;
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
      message: 'Password reset OTP has been sent.',
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
      throw new BadRequestException('Invalid OTP code');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
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
  async claimLookup(identifier: string, role?: string) {
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
      return `${u.slice(0, 2)}***@${d}`;
    };

    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
   * Send activation OTP to claim a profile
   */
  async claimSendOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User record not found');
    }

    const destination = user.email || user.mobile;
    const channel = user.email ? OtpChannel.EMAIL : OtpChannel.SMS;

    const otpResult = await this.otpService.sendOtp(destination!, channel);

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
      throw new BadRequestException('Invalid activation OTP code');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    const [updatedUser] = await this.prisma.$transaction([
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
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }],
      },
      include: {
        studentDetails: true,
        alumniDetails: true,
      },
    });
  }

  private async generateTokens(user: User) {
    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'alumni_super_secret_jwt_access_key_2026_x99',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'alumni_super_secret_jwt_refresh_key_2026_z88',
    );

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
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
