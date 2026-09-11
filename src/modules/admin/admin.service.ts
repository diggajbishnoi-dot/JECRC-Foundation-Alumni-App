import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, MentorshipStatus, Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List alumni users pending admin verification
   */
  async getUnverifiedAlumni(pagination: PaginationQueryDto) {
    const where = {
      role: Role.ALUMNI,
      isVerified: false,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          alumniDetails: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map(({ passwordHash, refreshTokenHash, ...safe }) => safe),
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  /**
   * Approve/verify alumni
   */
  async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    // Notify user of verification
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_VERIFIED_BY_ADMIN',
        payload: { verifiedAt: new Date().toISOString() },
      },
    });

    const { passwordHash, refreshTokenHash, ...safe } = updated;
    return safe;
  }

  /**
   * Delete spam post
   */
  async deletePost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post successfully deleted by admin moderation' };
  }

  /**
   * Delete spam discussion thread
   */
  async deleteDiscussion(threadId: string) {
    const thread = await this.prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Discussion thread not found');

    await this.prisma.discussionThread.delete({ where: { id: threadId } });
    return { message: 'Discussion thread deleted by admin moderation' };
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.prisma.group.delete({ where: { id: groupId } });
    return { message: 'Group deleted by admin moderation' };
  }

  /**
   * Dashboard Analytics & Community KPIs
   */
  async getDashboardStats() {
    const [
      totalStudents,
      totalAlumni,
      totalPosts,
      totalDiscussions,
      activeConnections,
      activeMentorships,
      totalGroups,
      pendingAlumniVerifications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.ALUMNI } }),
      this.prisma.post.count(),
      this.prisma.discussionThread.count(),
      this.prisma.connection.count({ where: { status: ConnectionStatus.ACCEPTED } }),
      this.prisma.mentorshipRequest.count({ where: { status: MentorshipStatus.ACCEPTED } }),
      this.prisma.group.count(),
      this.prisma.user.count({ where: { role: Role.ALUMNI, isVerified: false } }),
    ]);

    return {
      totalStudents,
      totalAlumni,
      totalUsers: totalStudents + totalAlumni,
      totalPosts,
      totalDiscussions,
      activeConnections,
      activeMentorships,
      totalGroups,
      pendingAlumniVerifications,
    };
  }
}
