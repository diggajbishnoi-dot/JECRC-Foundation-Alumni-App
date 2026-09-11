import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MentorshipStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMentorshipRequestDto,
  MentorOptInDto,
  QueryMentorsDto,
  QueryMyMentorshipsDto,
} from './dto/mentorship.dto';

@Injectable()
export class MentorshipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Alumni opts in or updates their MentorProfile
   */
  async optInAsMentor(userId: string, userRole: Role, dto: MentorOptInDto) {
    if (userRole !== Role.ALUMNI) {
      throw new ForbiddenException('Only Alumni users can register as mentors');
    }

    const profile = await this.prisma.mentorProfile.upsert({
      where: { userId },
      update: {
        domains: dto.domains,
        bio: dto.bio,
        availability: dto.availability,
        maxMentees: dto.maxMentees ?? 3,
        isActive: dto.isActive ?? true,
      },
      create: {
        userId,
        domains: dto.domains,
        bio: dto.bio,
        availability: dto.availability,
        maxMentees: dto.maxMentees ?? 3,
        isActive: dto.isActive ?? true,
      },
    });

    return profile;
  }

  /**
   * Search and filter active mentors
   */
  async getMentors(query: QueryMentorsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      isActive: true,
      user: { isVerified: true },
    };

    if (query.domain) {
      where.domains = { has: query.domain };
    }

    if (query.company) {
      where.user = {
        ...where.user,
        alumniDetails: {
          currentCompany: { contains: query.company, mode: 'insensitive' },
        },
      };
    }

    const [mentors, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicUrl: true,
              city: true,
              alumniDetails: true,
            },
          },
        },
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    // Fetch active mentorship counts per mentor
    const mentorUserIds = mentors.map((m) => m.userId);
    const activeMentorships = await this.prisma.mentorshipRequest.groupBy({
      by: ['mentorId'],
      where: {
        mentorId: { in: mentorUserIds },
        status: MentorshipStatus.ACCEPTED,
      },
      _count: { _all: true },
    });

    const activeCountMap = new Map<string, number>();
    for (const item of activeMentorships) {
      activeCountMap.set(item.mentorId, item._count._all);
    }

    const items = mentors.map((m) => {
      const activeMenteesCount = activeCountMap.get(m.userId) || 0;
      return {
        id: m.id,
        userId: m.userId,
        domains: m.domains,
        bio: m.bio,
        availability: m.availability,
        maxMentees: m.maxMentees,
        isActive: m.isActive,
        user: m.user,
        activeMenteesCount,
        isAcceptingMentees: activeMenteesCount < m.maxMentees,
      };
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Student sends a mentorship request
   */
  async requestMentorship(
    studentId: string,
    studentRole: Role,
    dto: CreateMentorshipRequestDto,
  ) {
    if (studentRole !== Role.STUDENT) {
      throw new ForbiddenException('Only students can request alumni mentorship');
    }

    if (studentId === dto.mentorId) {
      throw new BadRequestException('You cannot request mentorship from yourself');
    }

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: dto.mentorId },
    });

    if (!mentorProfile || !mentorProfile.isActive) {
      throw new BadRequestException('This alumni is currently not accepting mentorship requests');
    }

    // Check active mentee cap
    const activeCount = await this.prisma.mentorshipRequest.count({
      where: {
        mentorId: dto.mentorId,
        status: MentorshipStatus.ACCEPTED,
      },
    });

    if (activeCount >= mentorProfile.maxMentees) {
      throw new BadRequestException(
        'This mentor has reached their maximum capacity of active mentees at this time',
      );
    }

    // Check existing request
    const existing = await this.prisma.mentorshipRequest.findFirst({
      where: {
        studentId,
        mentorId: dto.mentorId,
        status: { in: [MentorshipStatus.PENDING, MentorshipStatus.ACCEPTED] },
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.status === MentorshipStatus.ACCEPTED
          ? 'You already have an active mentorship with this mentor'
          : 'You already have a pending mentorship request to this mentor',
      );
    }

    const request = await this.prisma.mentorshipRequest.create({
      data: {
        studentId,
        mentorId: dto.mentorId,
        message: dto.message,
        status: MentorshipStatus.PENDING,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: dto.mentorId,
        type: 'MENTORSHIP_REQUEST',
        payload: { studentId, mentorshipId: request.id },
      },
    });

    return request;
  }

  /**
   * Mentor responds: Accept
   * On ACCEPTED, unlocked chat is enabled between student & mentor!
   */
  async acceptMentorship(mentorId: string, requestId: string) {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.mentorId !== mentorId) {
      throw new NotFoundException('Mentorship request not found');
    }

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
    });

    const activeCount = await this.prisma.mentorshipRequest.count({
      where: { mentorId, status: MentorshipStatus.ACCEPTED },
    });

    if (mentorProfile && activeCount >= mentorProfile.maxMentees) {
      throw new BadRequestException('You have reached your maximum number of active mentees');
    }

    const updated = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: MentorshipStatus.ACCEPTED },
    });

    await this.prisma.notification.create({
      data: {
        userId: request.studentId,
        type: 'MENTORSHIP_ACCEPTED',
        payload: { mentorId, mentorshipId: requestId },
      },
    });

    return updated;
  }

  /**
   * Mentor responds: Reject
   */
  async rejectMentorship(mentorId: string, requestId: string) {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.mentorId !== mentorId) {
      throw new NotFoundException('Mentorship request not found');
    }

    return await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: MentorshipStatus.REJECTED },
    });
  }

  /**
   * Mark mentorship as COMPLETED or ENDED
   */
  async closeMentorship(
    userId: string,
    requestId: string,
    targetStatus: MentorshipStatus,
  ) {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Mentorship request not found');
    }

    if (request.studentId !== userId && request.mentorId !== userId) {
      throw new ForbiddenException('Only the student or mentor can close this relationship');
    }

    return await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: targetStatus },
    });
  }

  /**
   * Get user's mentorship relationships
   */
  async getMyMentorships(userId: string, query: QueryMyMentorshipsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      OR: [{ studentId: userId }, { mentorId: userId }],
    };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.mentorshipRequest.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              profilePicUrl: true,
              studentDetails: true,
            },
          },
          mentor: {
            select: {
              id: true,
              name: true,
              profilePicUrl: true,
              alumniDetails: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.mentorshipRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
