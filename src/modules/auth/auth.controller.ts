import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ClaimLookupDto,
  ClaimSendOtpDto,
  ClaimActivateDto,
} from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register Student or Alumni',
    description: 'Registers user with email. Dispatches a 6-digit OTP to the registered email address.',
  })
  @ApiResponse({ status: 201, description: 'User registered, OTP sent' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email or Mobile already in use' })
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify One-Time Registration OTP',
    description:
      'Permanently verifies user and immediately issues JWT access + refresh tokens. After this single verification, all future logins are normal password-based.',
  })
  @ApiResponse({ status: 200, description: 'Verified and auto-logged in' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return await this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Direct Login with Password',
    description:
      'Standard email/mobile + password login for verified accounts. NO OTP re-triggered for normal logins.',
  })
  @ApiResponse({ status: 200, description: 'Login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account not verified' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Logout User',
    description: 'Revokes the active refresh token session for the authenticated user, preventing token renewal.',
  })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('id') userId: string) {
    return await this.authService.logout(userId);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend Registration OTP',
    description: 'Resends a fresh 6-digit OTP if the initial one expired before verification (rate-limited).',
  })
  @ApiResponse({ status: 200, description: 'New OTP dispatched' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return await this.authService.resendOtp(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Rotates refresh token and returns fresh access token (15m expiration).',
  })
  @ApiResponse({ status: 200, description: 'New tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return await this.authService.refreshTokens(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request Password Reset OTP',
    description: 'Dispatches OTP via registered email address.',
  })
  @ApiResponse({ status: 200, description: 'Reset OTP dispatched' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset Password with OTP',
    description: 'Verifies reset OTP and updates user password.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto);
  }

  @Public()
  @Post('claim-lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup Pre-seeded Student or Alumni Record',
    description: 'Searches pre-imported college records by email or mobile to claim and activate profile.',
  })
  @ApiResponse({ status: 200, description: 'Lookup result returned' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async claimLookup(@Body() dto: ClaimLookupDto, @Req() req: any) {
    const clientIp =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '127.0.0.1';
    return await this.authService.claimLookup(dto.identifier, dto.role, clientIp);
  }

  @Public()
  @Post('claim-send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Activation OTP for Profile Claim',
    description: 'Dispatches 6-digit OTP to pre-registered contact of the matched institutional record.',
  })
  @ApiResponse({ status: 200, description: 'Activation OTP dispatched' })
  async claimSendOtp(@Body() dto: ClaimSendOtpDto) {
    return await this.authService.claimSendOtp(dto.userId);
  }

  @Public()
  @Post('claim-activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate Claimed Profile',
    description: 'Verifies OTP, sets user password, marks profile active, and issues login JWT tokens.',
  })
  @ApiResponse({ status: 200, description: 'Profile claimed and logged in' })
  @ApiResponse({ status: 400, description: 'Invalid or expired activation OTP' })
  async claimActivate(@Body() dto: ClaimActivateDto) {
    return await this.authService.claimActivate(dto);
  }
}
