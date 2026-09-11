import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InMemoryDb } from './in-memory-db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isMock = false;
  private inMemoryDb = new InMemoryDb();

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isMock = false;
      this.logger.log('Successfully connected to PostgreSQL via Prisma');
    } catch (error) {
      this.isMock = true;
      this.logger.warn(`Could not connect to PostgreSQL: ${error.message}`);
      this.logger.log('Running with high-fidelity In-Memory Database fallback populated with seed data.');
      this.setupInMemoryFallback();
    }
  }

  private setupInMemoryFallback() {
    const db = this.inMemoryDb;
    const userRelations = {
      studentDetails: { collection: 'studentDetails' as const, foreignKey: 'userId', single: true },
      alumniDetails: { collection: 'alumniDetails' as const, foreignKey: 'userId', single: true },
      mentorProfile: { collection: 'mentorProfiles' as const, foreignKey: 'userId', single: true },
      posts: { collection: 'posts' as const, foreignKey: 'userId' },
      sentConnections: { collection: 'connections' as const, foreignKey: 'requesterId' },
      receivedConnections: { collection: 'connections' as const, foreignKey: 'receiverId' },
      discussionThreads: { collection: 'discussionThreads' as const, foreignKey: 'userId' },
      notifications: { collection: 'notifications' as const, foreignKey: 'userId' },
    };

    (this as any).user = db.makeDelegate('users', userRelations);
    (this as any).studentDetails = db.makeDelegate('studentDetails', { user: { collection: 'users', foreignKey: 'userId', single: true } });
    (this as any).alumniDetails = db.makeDelegate('alumniDetails', { user: { collection: 'users', foreignKey: 'userId', single: true } });
    (this as any).mentorProfile = db.makeDelegate('mentorProfiles', { user: { collection: 'users', foreignKey: 'userId', single: true } });
    (this as any).post = db.makeDelegate('posts', { user: { collection: 'users', foreignKey: 'userId', single: true } });
    (this as any).discussionThread = db.makeDelegate('discussionThreads', {
      user: { collection: 'users', foreignKey: 'userId', single: true },
      replies: { collection: 'discussionReplies', foreignKey: 'threadId' },
      upvotes: { collection: 'discussionUpvotes', foreignKey: 'threadId' },
    });
    (this as any).discussionReply = db.makeDelegate('discussionReplies', {
      user: { collection: 'users', foreignKey: 'userId', single: true },
      thread: { collection: 'discussionThreads', foreignKey: 'threadId', single: true },
    });
    (this as any).discussionUpvote = db.makeDelegate('discussionUpvotes');
    (this as any).connection = db.makeDelegate('connections', {
      requester: { collection: 'users', foreignKey: 'requesterId', single: true },
      receiver: { collection: 'users', foreignKey: 'receiverId', single: true },
    });
    (this as any).group = db.makeDelegate('groups', {
      createdBy: { collection: 'users', foreignKey: 'createdById', single: true },
      memberships: { collection: 'groupMemberships', foreignKey: 'groupId' },
    });
    (this as any).groupMembership = db.makeDelegate('groupMemberships', {
      user: { collection: 'users', foreignKey: 'userId', single: true },
      group: { collection: 'groups', foreignKey: 'groupId', single: true },
    });
    (this as any).mentorshipRequest = db.makeDelegate('mentorshipRequests', {
      student: { collection: 'users', foreignKey: 'studentId', single: true },
      mentor: { collection: 'users', foreignKey: 'mentorId', single: true },
    });
    (this as any).notification = db.makeDelegate('notifications');
    (this as any).deviceToken = db.makeDelegate('deviceTokens');
    (this as any).otpVerification = db.makeDelegate('otpVerifications');
    (this as any).message = db.makeDelegate('messages', {
      sender: { collection: 'users', foreignKey: 'senderId', single: true },
      receiver: { collection: 'users', foreignKey: 'receiverId', single: true },
    });
  }

  async onModuleDestroy() {
    if (!this.isMock) {
      await this.$disconnect();
    }
    this.logger.log('Disconnected from database service');
  }
}
