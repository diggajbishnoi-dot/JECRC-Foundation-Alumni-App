import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupRole, GroupType, Prisma, Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateThreadDto } from '../discussions/dto/discussions.dto';
import { CreateGroupDto, QueryGroupsDto, UpdateGroupDto } from './dto/groups.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an Affinity Group (Batch or Interest)
   */
  async createGroup(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: dto.name,
          type: dto.type,
          description: dto.description || null,
          createdById: userId,
        },
      });

      // Creator automatically becomes Group ADMIN
      await tx.groupMembership.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: GroupRole.ADMIN,
        },
      });

      return newGroup;
    });

    return group;
  }

  /**
   * Get paginated groups
   */
  async getGroups(query: QueryGroupsDto, currentUserId?: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.GroupWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { memberships: true, threads: true },
          },
          memberships: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { role: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      description: g.description,
      createdAt: g.createdAt,
      totalMembers: g._count.memberships,
      totalThreads: g._count.threads,
      isMember: currentUserId ? (g.memberships as any)?.length > 0 : false,
      myRole: currentUserId && (g.memberships as any)?.[0]?.role ? (g.memberships as any)[0].role : null,
    }));

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Auto-suggest groups matching the user's batch, passout year, or branch
   */
  async getSuggestedGroups(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentDetails: true, alumniDetails: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const searchTerms: string[] = [];
    if (user.studentDetails) {
      searchTerms.push(user.studentDetails.branch);
      searchTerms.push(user.studentDetails.expectedPassoutYear.toString());
    }
    if (user.alumniDetails) {
      searchTerms.push(user.alumniDetails.branch);
      searchTerms.push(user.alumniDetails.batch);
      searchTerms.push(user.alumniDetails.passoutYear.toString());
    }

    const orClauses = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
      { description: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
    ]);

    const suggested = await this.prisma.group.findMany({
      where: {
        OR: orClauses.length > 0 ? orClauses : undefined,
        // Exclude groups user is already a member of
        memberships: {
          none: { userId },
        },
      },
      take: 10,
      include: {
        _count: { select: { memberships: true } },
      },
    });

    return suggested.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      description: g.description,
      totalMembers: g._count.memberships,
    }));
  }

  /**
   * Join a group
   */
  async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existing = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (existing) {
      throw new ConflictException('You are already a member of this group');
    }

    return await this.prisma.groupMembership.create({
      data: {
        groupId,
        userId,
        role: GroupRole.MEMBER,
      },
    });
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, userId: string) {
    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.groupMembership.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    return { message: 'Successfully left the group' };
  }

  /**
   * List group members
   */
  async getGroupMembers(groupId: string, pagination: PaginationQueryDto) {
    const where = { groupId };

    const [members, total] = await Promise.all([
      this.prisma.groupMembership.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
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
        },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.groupMembership.count({ where }),
    ]);

    return {
      items: members,
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  /**
   * Get group discussions (scoped to group)
   */
  async getGroupDiscussions(
    groupId: string,
    pagination: PaginationQueryDto,
    currentUserId?: string,
  ) {
    const where = { groupId };

    const [threads, total] = await Promise.all([
      this.prisma.discussionThread.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
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
            select: { replies: true, upvotes: true },
          },
        },
      }),
      this.prisma.discussionThread.count({ where }),
    ]);

    return {
      items: threads,
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  /**
   * Create discussion inside a group
   */
  async createGroupDiscussion(
    groupId: string,
    userId: string,
    dto: CreateThreadDto,
  ) {
    // Verify membership
    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must join this group before posting discussions');
    }

    return await this.prisma.discussionThread.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        groupId,
        userId,
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
   * Update group
   */
  async updateGroup(
    groupId: string,
    userId: string,
    userRole: Role,
    dto: UpdateGroupDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    const isGroupAdmin = membership?.role === GroupRole.ADMIN;
    const isCreator = group.createdById === userId;
    const isPlatformAdmin = userRole === Role.ADMIN;

    if (!isGroupAdmin && !isCreator && !isPlatformAdmin) {
      throw new ForbiddenException('Only group admins or creators can update group details');
    }

    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  /**
   * Delete group (creator or admin)
   */
  async deleteGroup(groupId: string, userId: string, userRole: Role) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.createdById !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only the group creator or platform admin can delete this group');
    }

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { message: 'Group deleted successfully' };
  }
}
