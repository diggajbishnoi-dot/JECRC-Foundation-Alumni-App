import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateReplyDto,
  CreateThreadDto,
  QueryThreadsDto,
} from './dto/discussions.dto';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new discussion thread
   */
  async createThread(userId: string, dto: CreateThreadDto) {
    return await this.prisma.discussionThread.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        groupId: dto.groupId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePicUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get paginated discussion threads (public or group-scoped)
   */
  async getThreads(query: QueryThreadsDto, currentUserId?: string) {
    const where: Prisma.DiscussionThreadWhereInput = {
      groupId: query.groupId ? query.groupId : null,
    };

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const take = limit;

    const [threads, total] = await Promise.all([
      this.prisma.discussionThread.findMany({
        where,
        skip,
        take,
        orderBy:
          query.sortBy === 'upvotes'
            ? { upvotes: { _count: 'desc' } }
            : { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profilePicUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
              upvotes: true,
            },
          },
          upvotes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
        },
      }),
      this.prisma.discussionThread.count({ where }),
    ]);

    const formatted = threads.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      groupId: t.groupId,
      createdAt: t.createdAt,
      user: t.user,
      totalReplies: t._count.replies,
      totalUpvotes: t._count.upvotes,
      isUpvoted: currentUserId ? (t.upvotes as any)?.length > 0 : false,
    }));

    return {
      items: formatted,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Get single thread details
   */
  async getThreadById(id: string, currentUserId?: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePicUrl: true,
            alumniDetails: true,
            studentDetails: true,
          },
        },
        _count: {
          select: {
            replies: true,
            upvotes: true,
          },
        },
        upvotes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!thread) {
      throw new NotFoundException('Discussion thread not found');
    }

    return {
      id: thread.id,
      title: thread.title,
      description: thread.description,
      category: thread.category,
      groupId: thread.groupId,
      createdAt: thread.createdAt,
      user: thread.user,
      totalReplies: thread._count.replies,
      totalUpvotes: thread._count.upvotes,
      isUpvoted: currentUserId ? (thread.upvotes as any)?.length > 0 : false,
    };
  }

  /**
   * Get paginated replies for a thread
   */
  async getThreadReplies(
    threadId: string,
    pagination: PaginationQueryDto,
    currentUserId?: string,
  ) {
    const where = { threadId };

    const [replies, total] = await Promise.all([
      this.prisma.discussionReply.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profilePicUrl: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
            },
          },
          upvotes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
        },
      }),
      this.prisma.discussionReply.count({ where }),
    ]);

    const formatted = replies.map((r) => ({
      id: r.id,
      threadId: r.threadId,
      content: r.content,
      createdAt: r.createdAt,
      user: r.user,
      totalUpvotes: r._count.upvotes,
      isUpvoted: currentUserId ? (r.upvotes as any)?.length > 0 : false,
    }));

    return {
      items: formatted,
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  /**
   * Add a reply to a discussion thread
   */
  async createReply(threadId: string, userId: string, dto: CreateReplyDto) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const reply = await this.prisma.discussionReply.create({
      data: {
        threadId,
        userId,
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePicUrl: true,
          },
        },
      },
    });

    // Notify thread author if someone else replied
    if (thread.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: thread.userId,
          type: 'THREAD_REPLY',
          payload: {
            threadId,
            replyId: reply.id,
            replierUserId: userId,
          },
        },
      });
    }

    return reply;
  }

  /**
   * Toggle upvote on a thread
   */
  async toggleThreadUpvote(threadId: string, userId: string) {
    const existing = await this.prisma.discussionUpvote.findUnique({
      where: {
        userId_threadId: {
          userId,
          threadId,
        },
      },
    });

    if (existing) {
      await this.prisma.discussionUpvote.delete({
        where: { id: existing.id },
      });
      return { upvoted: false, message: 'Upvote removed' };
    }

    await this.prisma.discussionUpvote.create({
      data: {
        userId,
        threadId,
      },
    });

    return { upvoted: true, message: 'Thread upvoted' };
  }

  /**
   * Toggle upvote on a reply
   */
  async toggleReplyUpvote(replyId: string, userId: string) {
    const existing = await this.prisma.discussionUpvote.findUnique({
      where: {
        userId_replyId: {
          userId,
          replyId,
        },
      },
    });

    if (existing) {
      await this.prisma.discussionUpvote.delete({
        where: { id: existing.id },
      });
      return { upvoted: false, message: 'Upvote removed' };
    }

    await this.prisma.discussionUpvote.create({
      data: {
        userId,
        replyId,
      },
    });

    return { upvoted: true, message: 'Reply upvoted' };
  }

  /**
   * Delete thread (owner or admin)
   */
  async deleteThread(id: string, userId: string, role: Role) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this thread');
    }

    await this.prisma.discussionThread.delete({
      where: { id },
    });

    return { message: 'Discussion thread deleted successfully' };
  }

  /**
   * Delete reply (owner or admin)
   */
  async deleteReply(replyId: string, userId: string, role: Role) {
    const reply = await this.prisma.discussionReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this reply');
    }

    await this.prisma.discussionReply.delete({
      where: { id: replyId },
    });

    return { message: 'Reply deleted successfully' };
  }

  /**
   * Report thread
   */
  async reportThread(id: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.prisma.discussionThread.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    });

    return { message: 'Thread reported for review' };
  }
}
