export declare class LoginDto {
    emailOrMobile: string;
    password: string;
}
export declare class VerifyOtpDto {
    emailOrMobile: string;
    otp: string;
}
export declare class ResendOtpDto {
    emailOrMobile: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ForgotPasswordDto {
    emailOrMobile: string;
}
export declare class ResetPasswordDto {
    emailOrMobile: string;
    otp: string;
    newPassword: string;
}
export declare class ClaimLookupDto {
    identifier: string;
    role?: string;
}
export declare class ClaimSendOtpDto {
    userId: string;
}
export declare class ClaimActivateDto {
    userId: string;
    otp: string;
    newPassword: string;
    headline?: string;
    company?: string;
    city?: string;
}
