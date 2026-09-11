import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    private isConnected;
    private inMemoryStore;
    private inMemorySets;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    setUserOnline(userId: string, socketId: string): Promise<void>;
    setUserOffline(userId: string, socketId: string): Promise<boolean>;
    isUserOnline(userId: string): Promise<boolean>;
    getLastSeen(userId: string): Promise<string | null>;
    checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean>;
}
