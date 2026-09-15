import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

@Injectable()
export class GlobalThrottlerGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    if (!req || !req.headers) {
      return true; // Skip non-HTTP contexts (e.g., WebSocket gateways)
    }

    // Identify requester: authenticated user ID or client IP address
    const userId = req.user?.id || req.user?.sub;
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;
    const key = `ratelimit:global:${identifier}`;

    // Global rate limit: 100 requests per 60 seconds (1 minute window)
    const MAX_REQUESTS = 100;
    const WINDOW_SECONDS = 60;

    const allowed = await this.redisService.checkRateLimit(key, MAX_REQUESTS, WINDOW_SECONDS);
    if (!allowed) {
      throw new HttpException(
        'Too Many Requests. Rate limit exceeded, please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
