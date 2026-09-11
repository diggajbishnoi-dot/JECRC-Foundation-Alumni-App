import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, ResendOtpDto, ResetPasswordDto, VerifyOtpDto, ClaimLookupDto, ClaimSendOtpDto, ClaimActivateDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        previewOtpForDev: string;
    } | {
        userId: any;
        channel: "SMS" | "EMAIL";
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
    claimLookup(dto: ClaimLookupDto): Promise<{
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
    claimSendOtp(dto: ClaimSendOtpDto): Promise<{
        success: boolean;
        destination: string;
        channel: "SMS" | "EMAIL";
        message: string;
        previewOtpForDev: string;
    }>;
    claimActivate(dto: ClaimActivateDto): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        user: any;
        message: string;
    }>;
}
