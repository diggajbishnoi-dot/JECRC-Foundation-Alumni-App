import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // In-memory fallback if Redis server is unavailable in local dev
  private inMemoryStore = new Map<string, { value: string; expiry?: number }>();
  private inMemorySets = new Map<string, Set<string>>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't crash if Redis is unavailable locally
        enableReadyCheck: true,
        connectTimeout: 2000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis connection error: ${err.message}. Falling back to in-memory store.`);
        }
        this.isConnected = false;
      });
    } catch (err) {
      this.logger.warn(`Redis initialization failed: ${err.message}. Running in in-memory mode.`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fall back to memory
      }
    }
    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fall back to memory
      }
    }
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryStore.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fall back to memory
      }
    }
    this.inMemoryStore.delete(key);
    this.inMemorySets.delete(key);
  }

  // Socket & Presence tracking
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const key = `user:${userId}:sockets`;
    if (this.isConnected && this.client) {
      try {
        await this.client.sadd(key, socketId);
        await this.client.set(`user:${userId}:status`, 'online');
        return;
      } catch {}
    }
    if (!this.inMemorySets.has(key)) {
      this.inMemorySets.set(key, new Set());
    }
    this.inMemorySets.get(key)!.add(socketId);
    await this.set(`user:${userId}:status`, 'online');
  }

  async setUserOffline(userId: string, socketId: string): Promise<boolean> {
    const key = `user:${userId}:sockets`;
    let remainingSockets = 0;

    if (this.isConnected && this.client) {
      try {
        await this.client.srem(key, socketId);
        remainingSockets = await this.client.scard(key);
      } catch {
        remainingSockets = 0;
      }
    } else {
      const set = this.inMemorySets.get(key);
      if (set) {
        set.delete(socketId);
        remainingSockets = set.size;
      }
    }

    if (remainingSockets === 0) {
      await this.set(`user:${userId}:status`, 'offline');
      await this.set(`user:${userId}:last_seen`, new Date().toISOString());
      return true; // Completely offline
    }
    return false; // Still has other active socket tabs/devices
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const status = await this.get(`user:${userId}:status`);
    return status === 'online';
  }

  async getLastSeen(userId: string): Promise<string | null> {
    return await this.get(`user:${userId}:last_seen`);
  }

  // Rate Limiting helper
  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    const current = await this.get(key);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= maxAttempts) {
      return false; // Exceeded limit
    }
    if (count === 0) {
      await this.set(key, '1', windowSeconds);
    } else {
      if (this.isConnected && this.client) {
        try {
          await this.client.incr(key);
        } catch {
          await this.set(key, (count + 1).toString());
        }
      } else {
        const item = this.inMemoryStore.get(key);
        const remainingTtl = item?.expiry ? Math.max(1, Math.ceil((item.expiry - Date.now()) / 1000)) : windowSeconds;
        await this.set(key, (count + 1).toString(), remainingTtl);
      }
    }
    return true;
  }

  /**
   * Increment a failed-attempt counter for a given key.
   * Only called when an OTP verification attempt fails.
   * Returns the new count after incrementing.
   * TTL is refreshed on every failed attempt (sliding window).
   */
  async incrementFailedAttempts(key: string, ttlSeconds: number): Promise<number> {
    const current = await this.get(key);
    const count = current ? parseInt(current, 10) : 0;
    const newCount = count + 1;
    await this.set(key, newCount.toString(), ttlSeconds);
    return newCount;
  }

  /**
   * Get current failed-attempt count for a key (0 if not set / expired).
   */
  async getFailedAttempts(key: string): Promise<number> {
    const current = await this.get(key);
    return current ? parseInt(current, 10) : 0;
  }

  /**
   * Clear the failed-attempt counter after a successful OTP verification.
   */
  async resetFailedAttempts(key: string): Promise<void> {
    await this.del(key);
  }
}
