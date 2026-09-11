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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = null;
        this.isConnected = false;
        this.inMemoryStore = new Map();
        this.inMemorySets = new Map();
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        try {
            this.client = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
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
        }
        catch (err) {
            this.logger.warn(`Redis initialization failed: ${err.message}. Running in in-memory mode.`);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit().catch(() => { });
        }
    }
    async get(key) {
        if (this.isConnected && this.client) {
            try {
                return await this.client.get(key);
            }
            catch {
            }
        }
        const item = this.inMemoryStore.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.inMemoryStore.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds) {
        if (this.isConnected && this.client) {
            try {
                if (ttlSeconds) {
                    await this.client.set(key, value, 'EX', ttlSeconds);
                }
                else {
                    await this.client.set(key, value);
                }
                return;
            }
            catch {
            }
        }
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
        this.inMemoryStore.set(key, { value, expiry });
    }
    async del(key) {
        if (this.isConnected && this.client) {
            try {
                await this.client.del(key);
                return;
            }
            catch {
            }
        }
        this.inMemoryStore.delete(key);
        this.inMemorySets.delete(key);
    }
    async setUserOnline(userId, socketId) {
        const key = `user:${userId}:sockets`;
        if (this.isConnected && this.client) {
            try {
                await this.client.sadd(key, socketId);
                await this.client.set(`user:${userId}:status`, 'online');
                return;
            }
            catch { }
        }
        if (!this.inMemorySets.has(key)) {
            this.inMemorySets.set(key, new Set());
        }
        this.inMemorySets.get(key).add(socketId);
        await this.set(`user:${userId}:status`, 'online');
    }
    async setUserOffline(userId, socketId) {
        const key = `user:${userId}:sockets`;
        let remainingSockets = 0;
        if (this.isConnected && this.client) {
            try {
                await this.client.srem(key, socketId);
                remainingSockets = await this.client.scard(key);
            }
            catch {
                remainingSockets = 0;
            }
        }
        else {
            const set = this.inMemorySets.get(key);
            if (set) {
                set.delete(socketId);
                remainingSockets = set.size;
            }
        }
        if (remainingSockets === 0) {
            await this.set(`user:${userId}:status`, 'offline');
            await this.set(`user:${userId}:last_seen`, new Date().toISOString());
            return true;
        }
        return false;
    }
    async isUserOnline(userId) {
        const status = await this.get(`user:${userId}:status`);
        return status === 'online';
    }
    async getLastSeen(userId) {
        return await this.get(`user:${userId}:last_seen`);
    }
    async checkRateLimit(key, maxAttempts, windowSeconds) {
        const current = await this.get(key);
        const count = current ? parseInt(current, 10) : 0;
        if (count >= maxAttempts) {
            return false;
        }
        await this.set(key, (count + 1).toString(), windowSeconds);
        return true;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map