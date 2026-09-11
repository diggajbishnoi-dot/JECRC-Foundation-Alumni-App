import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    isMock: boolean;
    private inMemoryDb;
    constructor();
    onModuleInit(): Promise<void>;
    private setupInMemoryFallback;
    onModuleDestroy(): Promise<void>;
}
