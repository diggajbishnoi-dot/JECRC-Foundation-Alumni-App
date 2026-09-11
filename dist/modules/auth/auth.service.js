"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const otp_service_1 = require("../../services/otp/otp.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService, otpService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.otpService = otpService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async runInTx(fn) {
        if (this.prisma.isMock) {
            return await fn(this.prisma);
        }
        return await this.prisma.$transaction(fn);
    }
    async runTxArray(actions) {
        if (this.prisma.isMock) {
            return await Promise.all(actions);
        }
        return await this.prisma.$transaction(actions);
    }
    async register(dto) {
        if (!dto.email && !dto.mobile) {
            throw new common_1.BadRequestException('At least one of email or mobile number must be provided');
        }
        const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
        const cleanMobile = dto.mobile ? dto.mobile.trim() : undefined;
        const channel = cleanMobile ? client_1.OtpChannel.SMS : client_1.OtpChannel.EMAIL;
        const destination = cleanMobile || cleanEmail;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    ...(cleanEmail ? [{ email: cleanEmail }, { email: dto.email.trim() }] : []),
                    ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
                ],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User already exists. An account with this email is already registered. Please sign in instead.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.runInTx(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: dto.name.trim(),
                    email: cleanEmail || null,
                    mobile: cleanMobile || null,
                    passwordHash,
                    role: dto.role,
                    isVerified: false,
                    publicKey: dto.publicKey || null,
                },
            });
            if (dto.role === client_1.Role.STUDENT) {
                await tx.studentDetails.create({
                    data: {
                        userId: newUser.id,
                        branch: dto.branch || 'CSE',
                        currentYear: dto.currentYear || 3,
                        expectedPassoutYear: dto.expectedPassoutYear || 2028,
                    },
                });
            }
            else if (dto.role === client_1.Role.ALUMNI) {
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
    async verifyOtp(dto) {
        const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
        if (!user) {
            throw new common_1.NotFoundException('No account found with this contact');
        }
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                userId: user.id,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestOtp) {
            throw new common_1.BadRequestException('No active OTP found or OTP has expired. Please request a new OTP.');
        }
        const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid OTP entered');
        }
        const [updatedUser] = await this.runTxArray([
            this.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            }),
            this.prisma.otpVerification.deleteMany({
                where: { userId: user.id },
            }),
        ]);
        const tokens = await this.generateTokens(updatedUser);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            message: 'Account verified successfully. Welcome to Alumni Network!',
            user: this.sanitizeUser(updatedUser),
            tokens,
        };
    }
    async login(dto) {
        const rateLimitKey = `ratelimit:login:${dto.emailOrMobile}`;
        const allowed = await this.redisService.checkRateLimit(rateLimitKey, 10, 60);
        if (!allowed) {
            throw new common_1.ForbiddenException('Too many login attempts. Please try again in a minute.');
        }
        const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email/mobile or password');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email/mobile or password');
        }
        if (!user.isVerified) {
            throw new common_1.ForbiddenException('Account is not yet verified. Please verify the one-time registration OTP sent to your contact.');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            message: 'Login successful',
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async resendOtp(dto) {
        const rateLimitKey = `ratelimit:resend_otp:${dto.emailOrMobile}`;
        const allowed = await this.redisService.checkRateLimit(rateLimitKey, 3, 300);
        if (!allowed) {
            throw new common_1.ForbiddenException('Please wait 5 minutes before requesting another OTP');
        }
        const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
        if (!user) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Account is already verified. You can log in directly with your password.');
        }
        const channel = user.mobile ? client_1.OtpChannel.SMS : client_1.OtpChannel.EMAIL;
        const destination = user.mobile || user.email;
        const otpResult = await this.otpService.sendOtp(destination, channel);
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
    async refreshTokens(dto) {
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', 'alumni_super_secret_jwt_refresh_key_2026_z88');
        let payload;
        try {
            payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Access denied');
        }
        const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Access denied: token has been revoked');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return { tokens };
    }
    async forgotPassword(dto) {
        const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
        if (!user) {
            return { message: 'If an account exists, a reset code has been dispatched.' };
        }
        const channel = user.mobile ? client_1.OtpChannel.SMS : client_1.OtpChannel.EMAIL;
        const destination = user.mobile || user.email;
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
    async resetPassword(dto) {
        const user = await this.findUserByEmailOrMobile(dto.emailOrMobile);
        if (!user) {
            throw new common_1.NotFoundException('Account not found');
        }
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                userId: user.id,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestOtp) {
            throw new common_1.BadRequestException('No active OTP found or it has expired');
        }
        const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid OTP code');
        }
        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.runTxArray([
            this.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    refreshTokenHash: null,
                },
            }),
            this.prisma.otpVerification.deleteMany({
                where: { userId: user.id },
            }),
        ]);
        return { message: 'Password has been successfully updated. You can now login.' };
    }
    async claimLookup(identifier, role) {
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
        const company = user.alumniDetails?.currentCompany || (user.role === client_1.Role.STUDENT ? 'Student' : 'Alumnus');
        const maskEmail = (em) => {
            if (!em)
                return '';
            const [u, d] = em.split('@');
            if (!d)
                return em;
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
    async claimSendOtp(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User record not found');
        }
        const destination = user.email || user.mobile;
        const channel = user.email ? client_1.OtpChannel.EMAIL : client_1.OtpChannel.SMS;
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
    async claimActivate(dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            include: { studentDetails: true, alumniDetails: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User record not found');
        }
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                userId: user.id,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestOtp) {
            throw new common_1.BadRequestException('No active OTP found or code has expired');
        }
        const isValid = await this.otpService.verifyOtp(dto.otp, latestOtp.otpCodeHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid activation OTP code');
        }
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
    async findUserByEmailOrMobile(identifier) {
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
    async generateTokens(user) {
        const accessSecret = this.configService.get('JWT_SECRET', 'alumni_super_secret_jwt_access_key_2026_x99');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', 'alumni_super_secret_jwt_refresh_key_2026_z88');
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
    async updateRefreshToken(userId, refreshToken) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: hash },
        });
    }
    sanitizeUser(user) {
        const { passwordHash, refreshTokenHash, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_service_1.OtpService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map