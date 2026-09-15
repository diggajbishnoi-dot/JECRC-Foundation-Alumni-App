import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../redis/redis.service';
import { GlobalThrottlerGuard, SKIP_THROTTLE_KEY } from './global-throttler.guard';

describe('GlobalThrottlerGuard (P1-006)', () => {
  let guard: GlobalThrottlerGuard;
  let redisService: RedisService;
  let reflector: Reflector;

  const mockRedisService = {
    checkRateLimit: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalThrottlerGuard,
        { provide: RedisService, useValue: mockRedisService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<GlobalThrottlerGuard>(GlobalThrottlerGuard);
    redisService = module.get<RedisService>(RedisService);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  function createMockContext(req: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should allow requests within the 100 requests per minute limit', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockRedisService.checkRateLimit.mockResolvedValue(true);

    const context = createMockContext({
      headers: {},
      ip: '192.168.1.1',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRedisService.checkRateLimit).toHaveBeenCalledWith(
      'ratelimit:global:ip:192.168.1.1',
      100,
      60,
    );
  });

  it('should throw 429 HttpException when global rate limit is exceeded', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockRedisService.checkRateLimit.mockResolvedValue(false);

    const context = createMockContext({
      headers: {},
      ip: '192.168.1.1',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS); // 429
      expect(err.message).toContain('Rate limit exceeded');
    }
  });

  it('should use authenticated user ID over IP when available', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockRedisService.checkRateLimit.mockResolvedValue(true);

    const context = createMockContext({
      headers: {},
      ip: '192.168.1.1',
      user: { id: 'user-uuid-123' },
    });

    await guard.canActivate(context);
    expect(mockRedisService.checkRateLimit).toHaveBeenCalledWith(
      'ratelimit:global:user:user-uuid-123',
      100,
      60,
    );
  });

  it('should use distinct keys for different IP addresses', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockRedisService.checkRateLimit.mockResolvedValue(true);

    const context1 = createMockContext({ headers: {}, ip: '10.0.0.1' });
    const context2 = createMockContext({ headers: {}, ip: '10.0.0.2' });

    await guard.canActivate(context1);
    await guard.canActivate(context2);

    expect(mockRedisService.checkRateLimit).toHaveBeenNthCalledWith(
      1,
      'ratelimit:global:ip:10.0.0.1',
      100,
      60,
    );
    expect(mockRedisService.checkRateLimit).toHaveBeenNthCalledWith(
      2,
      'ratelimit:global:ip:10.0.0.2',
      100,
      60,
    );
  });

  it('should skip rate limiting when skipThrottle metadata is set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);

    const context = createMockContext({ headers: {}, ip: '192.168.1.1' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockRedisService.checkRateLimit).not.toHaveBeenCalled();
  });
});
