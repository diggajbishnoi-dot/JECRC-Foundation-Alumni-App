import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'rahul@alumni.edu or +919876543210', description: 'Registered email or mobile number' })
  @IsString()
  @IsNotEmpty()
  emailOrMobile: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'rahul@alumni.edu or +919876543210', description: 'Registered email or mobile' })
  @IsString()
  @IsNotEmpty()
  emailOrMobile: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP received via Email' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'rahul@alumni.edu or +919876543210' })
  @IsString()
  @IsNotEmpty()
  emailOrMobile: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT Refresh Token received at login/verification' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'rahul@alumni.edu or +919876543210' })
  @IsString()
  @IsNotEmpty()
  emailOrMobile: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'rahul@alumni.edu or +919876543210' })
  @IsString()
  @IsNotEmpty()
  emailOrMobile: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'NewStrongPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}

export class ClaimLookupDto {
  @ApiProperty({ example: 'aarav.mehta@jecrc.ac.in or +919876543210', description: 'Pre-seeded email, mobile, or roll number' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiPropertyOptional({ example: 'ALUMNI', enum: ['ALUMNI', 'STUDENT'] })
  @IsOptional()
  @IsString()
  role?: string;
}

export class ClaimSendOtpDto {
  @ApiProperty({ example: 'user-uuid-1234', description: 'User ID of the pre-seeded record' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class ClaimActivateDto {
  @ApiProperty({ example: 'user-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '123456', description: '6-digit activation OTP' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'MyNewPassword@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer @ Google' })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;
}
