import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OtpService } from '../../services/otp/otp.service';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, ResendOtpDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly otpService;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, otpService: OtpService, redisService: RedisService);
    register(dto: RegisterDto): Promise<{
        userId: string;
        channel: "EMAIL" | "SMS";
        destination: string;
        message: string;
        previewOtpForDev: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        user: any;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        user: any;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
        previewOtpForDev: string;
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        previewOtpForDev?: undefined;
    } | {
        message: string;
        previewOtpForDev: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    claimLookup(identifier: string, role?: string): Promise<{
        found: boolean;
        message: string;
        user?: undefined;
    } | {
        found: boolean;
        user: {
            id: string;
            name: string;
            email: string;
            maskedEmail: string;
            role: import(".prisma/client").$Enums.Role;
            branch: string;
            batch: string;
            company: string;
            city: string;
            isClaimed: boolean;
        };
        message?: undefined;
    }>;
    claimSendOtp(userId: string): Promise<{
        success: boolean;
        destination: string;
        channel: "EMAIL" | "SMS";
        message: string;
        previewOtpForDev: string;
    }>;
    claimActivate(dto: {
        userId: string;
        otp: string;
        newPassword: string;
        headline?: string;
        company?: string;
        city?: string;
    }): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        user: any;
        message: string;
    }>;
    private findUserByEmailOrMobile;
    private generateTokens;
    private updateRefreshToken;
    private sanitizeUser;
}
