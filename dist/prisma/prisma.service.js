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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const in_memory_db_1 = require("./in-memory-db");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.isMock = false;
        this.inMemoryDb = new in_memory_db_1.InMemoryDb();
    }
    async onModuleInit() {
        let connected = false;
        try {
            await this.$connect();
            connected = true;
        }
        catch (connErr) {
            this.logger.warn(`Could not connect to PostgreSQL server: ${connErr.message}`);
            this.isMock = true;
            this.logger.log('Running with high-fidelity In-Memory Database fallback populated with seed data.');
            this.setupInMemoryFallback();
            return;
        }
        try {
            await this.$queryRawUnsafe('SELECT 1 FROM "users" LIMIT 1;');
            this.isMock = false;
            this.logger.log('Successfully connected to PostgreSQL via Prisma (schema tables verified)');
        }
        catch (tableErr) {
            this.logger.warn(`PostgreSQL connected, but tables are missing: ${tableErr.message}`);
            let synced = false;
            try {
                const { execSync } = require('child_process');
                this.logger.log('Attempting automatic schema sync: npx prisma db push --accept-data-loss ...');
                execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'pipe' });
                await this.$queryRawUnsafe('SELECT 1 FROM "users" LIMIT 1;');
                this.isMock = false;
                synced = true;
                this.logger.log('PostgreSQL schema tables created and verified successfully!');
            }
            catch (syncErr) {
                this.logger.warn(`Automatic schema push could not complete: ${syncErr.message}`);
            }
            if (!synced) {
                this.isMock = true;
                this.logger.log('Falling back to high-fidelity In-Memory Database fallback populated with seed data.');
                this.setupInMemoryFallback();
            }
        }
    }
    setupInMemoryFallback() {
        const db = this.inMemoryDb;
        const userRelations = {
            studentDetails: { collection: 'studentDetails', foreignKey: 'userId', single: true },
            alumniDetails: { collection: 'alumniDetails', foreignKey: 'userId', single: true },
            mentorProfile: { collection: 'mentorProfiles', foreignKey: 'userId', single: true },
            posts: { collection: 'posts', foreignKey: 'userId' },
            sentConnections: { collection: 'connections', foreignKey: 'requesterId' },
            receivedConnections: { collection: 'connections', foreignKey: 'receiverId' },
            discussionThreads: { collection: 'discussionThreads', foreignKey: 'userId' },
            notifications: { collection: 'notifications', foreignKey: 'userId' },
        };
        this.user = db.makeDelegate('users', userRelations);
        this.studentDetails = db.makeDelegate('studentDetails', { user: { collection: 'users', foreignKey: 'userId', single: true } });
        this.alumniDetails = db.makeDelegate('alumniDetails', { user: { collection: 'users', foreignKey: 'userId', single: true } });
        this.mentorProfile = db.makeDelegate('mentorProfiles', { user: { collection: 'users', foreignKey: 'userId', single: true } });
        this.post = db.makeDelegate('posts', { user: { collection: 'users', foreignKey: 'userId', single: true } });
        this.discussionThread = db.makeDelegate('discussionThreads', {
            user: { collection: 'users', foreignKey: 'userId', single: true },
            replies: { collection: 'discussionReplies', foreignKey: 'threadId' },
            upvotes: { collection: 'discussionUpvotes', foreignKey: 'threadId' },
        });
        this.discussionReply = db.makeDelegate('discussionReplies', {
            user: { collection: 'users', foreignKey: 'userId', single: true },
            thread: { collection: 'discussionThreads', foreignKey: 'threadId', single: true },
        });
        this.discussionUpvote = db.makeDelegate('discussionUpvotes');
        this.connection = db.makeDelegate('connections', {
            requester: { collection: 'users', foreignKey: 'requesterId', single: true },
            receiver: { collection: 'users', foreignKey: 'receiverId', single: true },
        });
        this.group = db.makeDelegate('groups', {
            createdBy: { collection: 'users', foreignKey: 'createdById', single: true },
            memberships: { collection: 'groupMemberships', foreignKey: 'groupId' },
        });
        this.groupMembership = db.makeDelegate('groupMemberships', {
            user: { collection: 'users', foreignKey: 'userId', single: true },
            group: { collection: 'groups', foreignKey: 'groupId', single: true },
        });
        this.mentorshipRequest = db.makeDelegate('mentorshipRequests', {
            student: { collection: 'users', foreignKey: 'studentId', single: true },
            mentor: { collection: 'users', foreignKey: 'mentorId', single: true },
        });
        this.notification = db.makeDelegate('notifications');
        this.deviceToken = db.makeDelegate('deviceTokens');
        this.otpVerification = db.makeDelegate('otpVerifications');
        this.message = db.makeDelegate('messages', {
            sender: { collection: 'users', foreignKey: 'senderId', single: true },
            receiver: { collection: 'users', foreignKey: 'receiverId', single: true },
        });
        this.$transaction = async (arg) => {
            if (typeof arg === 'function') {
                return await arg(this);
            }
            if (Array.isArray(arg)) {
                return await Promise.all(arg);
            }
            return arg;
        };
    }
    async onModuleDestroy() {
        if (!this.isMock) {
            await this.$disconnect();
        }
        this.logger.log('Disconnected from database service');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map