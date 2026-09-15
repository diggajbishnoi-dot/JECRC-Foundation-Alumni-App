"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const redis_service_1 = require("../src/redis/redis.service");
const otp_service_1 = require("../src/services/otp/otp.service");
const http_exception_filter_1 = require("../src/common/filters/http-exception.filter");
const transform_interceptor_1 = require("../src/common/interceptors/transform.interceptor");
const bcrypt = require("bcrypt");
const TEST_EMAIL = `e2e.test.${Date.now()}@alumni.jecrcfoundation.com`;
const TEST_PASSWORD = 'E2ETest@999';
const FIXED_OTP = '123456';
const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ success: true, previewOtpForDev: FIXED_OTP }),
    verifyOtp: jest.fn().mockResolvedValue(true),
    generateOtp: jest.fn().mockReturnValue(FIXED_OTP),
};
let storedUser = null;
let storedOtp = null;
const mockPrisma = {
    user: {
        findFirst: jest.fn(({ where }) => {
            if (!storedUser)
                return null;
            if (where?.email === storedUser.email)
                return storedUser;
            if (where?.id === storedUser.id)
                return storedUser;
            if (where?.OR) {
                const match = where.OR.some((c) => c.email === storedUser.email || c.mobile === storedUser.mobile);
                return match ? storedUser : null;
            }
            return null;
        }),
        findUnique: jest.fn(({ where }) => {
            if (!storedUser)
                return null;
            if (where?.email === storedUser.email)
                return storedUser;
            if (where?.id === storedUser.id)
                return storedUser;
            return null;
        }),
        create: jest.fn(({ data }) => {
            storedUser = { id: 'user-e2e-001', isVerified: false, refreshTokenHash: null, ...data };
            return storedUser;
        }),
        update: jest.fn(({ where, data }) => {
            if (storedUser && (where?.id === storedUser.id || where?.email === storedUser.email)) {
                storedUser = { ...storedUser, ...data };
            }
            return storedUser;
        }),
    },
    otpVerification: {
        findFirst: jest.fn(() => storedOtp),
        create: jest.fn(({ data }) => {
            storedOtp = { id: 'otp-001', usedAt: null, ...data };
            return storedOtp;
        }),
        update: jest.fn(({ data }) => {
            storedOtp = storedOtp ? { ...storedOtp, ...data } : null;
            return storedOtp;
        }),
        deleteMany: jest.fn(() => ({ count: 1 })),
        updateMany: jest.fn(() => ({ count: 1 })),
        count: jest.fn(() => 0),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
};
const mockRedisService = {
    checkRateLimit: jest.fn().mockResolvedValue(true),
    isUserOnline: jest.fn().mockResolvedValue(false),
    setUserOnline: jest.fn(),
    setUserOffline: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn(),
};
describe('Auth E2E Integration (P3-001)', () => {
    let app;
    let accessToken;
    let refreshToken;
    beforeAll(async () => {
        storedUser = null;
        storedOtp = null;
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrisma)
            .overrideProvider(redis_service_1.RedisService)
            .useValue(mockRedisService)
            .overrideProvider(otp_service_1.OtpService)
            .useValue(mockOtpService)
            .compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('GET /health', () => {
        it('returns 200 with status ok', async () => {
            const res = await request(app.getHttpServer()).get('/health').expect(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.timestamp).toBeDefined();
        });
    });
    describe('POST /auth/register', () => {
        it('rejects request with missing password (validation)', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: TEST_EMAIL, name: 'E2E Test' })
                .expect(400);
        });
        it('rejects weak password below minimum length', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: TEST_EMAIL, password: 'short', name: 'E2E Test' })
                .expect(400);
        });
        it('registers a new user successfully', async () => {
            const hashedOtp = await bcrypt.hash(FIXED_OTP, 10);
            storedOtp = {
                id: 'otp-001',
                userId: 'user-e2e-001',
                otpHash: hashedOtp,
                channel: 'EMAIL',
                expiresAt: new Date(Date.now() + 600_000),
                usedAt: null,
                attempts: 0,
            };
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                name: 'E2E Test User',
                role: 'ALUMNI',
            })
                .expect(201);
            expect(res.body.data?.message || res.body.message).toMatch(/otp|verify|sent/i);
        });
        it('rejects duplicate email with 409', async () => {
            mockPrisma.user.findFirst.mockResolvedValueOnce(storedUser);
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                name: 'Duplicate',
                role: 'ALUMNI',
            })
                .expect(409);
        });
    });
    describe('POST /auth/verify-otp', () => {
        it('rejects missing OTP (validation)', async () => {
            await request(app.getHttpServer())
                .post('/auth/verify-otp')
                .send({ emailOrMobile: TEST_EMAIL })
                .expect(400);
        });
        it('verifies OTP and returns access + refresh tokens', async () => {
            if (storedUser)
                storedUser.isVerified = false;
            const hashedOtp = await bcrypt.hash(FIXED_OTP, 10);
            storedOtp = {
                id: 'otp-001',
                userId: storedUser?.id || 'user-e2e-001',
                otpHash: hashedOtp,
                channel: 'EMAIL',
                expiresAt: new Date(Date.now() + 600_000),
                usedAt: null,
                attempts: 0,
            };
            const res = await request(app.getHttpServer())
                .post('/auth/verify-otp')
                .send({ emailOrMobile: TEST_EMAIL, otp: FIXED_OTP })
                .expect(200);
            const tokens = res.body.data?.tokens || res.body.tokens;
            expect(tokens?.accessToken).toBeDefined();
            expect(tokens?.refreshToken).toBeDefined();
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
        });
    });
    describe('POST /auth/login', () => {
        it('rejects login with wrong password', async () => {
            if (storedUser)
                storedUser.isVerified = true;
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ emailOrMobile: TEST_EMAIL, password: 'WrongPassword99' })
                .expect(401);
        });
        it('logs in successfully and returns tokens', async () => {
            const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
            if (storedUser) {
                storedUser.passwordHash = passwordHash;
                storedUser.isVerified = true;
            }
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ emailOrMobile: TEST_EMAIL, password: TEST_PASSWORD })
                .expect(200);
            const tokens = res.body.data?.tokens || res.body.tokens;
            expect(tokens?.accessToken).toBeDefined();
            expect(tokens?.refreshToken).toBeDefined();
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
        });
    });
    describe('POST /auth/refresh', () => {
        it('rejects request with no refresh token (validation)', async () => {
            await request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400);
        });
        it('refreshes tokens using valid refresh token', async () => {
            if (storedUser && refreshToken) {
                const hash = await bcrypt.hash(refreshToken, 10);
                storedUser.refreshTokenHash = hash;
            }
            const res = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            const tokens = res.body.data?.tokens || res.body.tokens;
            expect(tokens?.accessToken).toBeDefined();
            if (tokens?.accessToken)
                accessToken = tokens.accessToken;
            if (tokens?.refreshToken)
                refreshToken = tokens.refreshToken;
        });
    });
    describe('Protected routes (JWT guard)', () => {
        it('rejects request without Authorization header (401)', async () => {
            await request(app.getHttpServer()).get('/users/me').expect(401);
        });
        it('rejects request with malformed token (401)', async () => {
            await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', 'Bearer not.a.valid.jwt')
                .expect(401);
        });
        it('reaches a protected route with a valid access token', async () => {
            if (storedUser)
                storedUser.isVerified = true;
            const res = await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect((r) => {
                if (r.status !== 200 && r.status !== 404) {
                    throw new Error(`Unexpected status ${r.status}: ${JSON.stringify(r.body)}`);
                }
            });
            expect([200, 404]).toContain(res.status);
        });
    });
    describe('POST /auth/logout', () => {
        it('rejects logout without token (401)', async () => {
            await request(app.getHttpServer()).post('/auth/logout').expect(401);
        });
        it('logs out successfully and invalidates session', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(res.body.data?.message || res.body.message).toMatch(/logout|logged out/i);
            expect(storedUser?.refreshTokenHash).toBeNull();
        });
    });
    describe('Rate limiting', () => {
        it('returns 429 when OTP rate limit is exceeded', async () => {
            mockRedisService.checkRateLimit.mockResolvedValueOnce(false);
            const res = await request(app.getHttpServer())
                .post('/auth/verify-otp')
                .send({ emailOrMobile: TEST_EMAIL, otp: '000000' });
            expect([429, 403]).toContain(res.status);
            mockRedisService.checkRateLimit.mockResolvedValue(true);
        });
    });
    describe('Error response safety', () => {
        it('400 response never leaks stack traces', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: 'not-an-email', password: 'x' })
                .expect(400);
            const body = JSON.stringify(res.body);
            expect(body).not.toMatch(/at Object\.|node_modules|\.ts:|\.js:/);
        });
        it('401 response returns generic message without internal details', async () => {
            const res = await request(app.getHttpServer())
                .get('/users/me')
                .expect(401);
            expect(res.body.statusCode || res.body.data?.statusCode).toBe(401);
            const body = JSON.stringify(res.body);
            expect(body).not.toMatch(/node_modules|\.ts:|\.js:|passwordHash|refreshTokenHash/);
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map