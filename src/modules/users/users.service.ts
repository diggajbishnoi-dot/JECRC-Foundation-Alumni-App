import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../services/storage/storage.service';
import {
  RegisterDeviceTokenDto,
  SearchUsersQueryDto,
  UpdateProfileDto,
  UploadPublicKeyDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get Current User Profile with role details and stats
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentDetails: true,
        alumniDetails: true,
        mentorProfile: true,
        _count: {
          select: {
            sentConnections: { where: { status: ConnectionStatus.ACCEPTED } },
            receivedConnections: { where: { status: ConnectionStatus.ACCEPTED } },
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const totalConnections =
      user._count.sentConnections + user._count.receivedConnections;

    const { passwordHash, refreshTokenHash, _count, ...safeUser } = user;
    return {
      ...safeUser,
      totalConnections,
      totalPosts: _count.posts,
    };
  }

  /**
   * Update Profile Details
   */
  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { alumniDetails: true, studentDetails: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const userUpdate: Prisma.UserUpdateInput = {};
      if (dto.name !== undefined) userUpdate.name = dto.name;
      if (dto.bio !== undefined) userUpdate.bio = dto.bio;
      if (dto.city !== undefined) userUpdate.city = dto.city;
      if (dto.hideLastSeen !== undefined) userUpdate.hideLastSeen = dto.hideLastSeen;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      if (user.role === Role.ALUMNI) {
        const alumniData: any = {};
        if (dto.branch !== undefined) alumniData.branch = dto.branch;
        if (dto.batch !== undefined) {
          alumniData.batch = dto.batch;
          const parsed = parseInt(dto.batch, 10);
          if (!isNaN(parsed)) alumniData.passoutYear = parsed;
        }
        if (dto.currentCompany !== undefined) alumniData.currentCompany = dto.currentCompany;
        if (dto.designation !== undefined) alumniData.designation = dto.designation;

        if (Object.keys(alumniData).length > 0) {
          if (user.alumniDetails) {
            await tx.alumniDetails.updateMany({
              where: { userId },
              data: alumniData,
            });
          } else {
            await tx.alumniDetails.create({
              data: {
                userId,
                branch: dto.branch || 'CSE',
                batch: dto.batch || '2020',
                passoutYear: parseInt(dto.batch || '2020', 10) || 2020,
                currentCompany: dto.currentCompany || '',
                designation: dto.designation || 'Alumnus',
              },
            });
          }
        }
      } else if (user.role === Role.STUDENT) {
        const studentData: any = {};
        if (dto.branch !== undefined) studentData.branch = dto.branch;
        if (dto.batch !== undefined) {
          const parsed = parseInt(dto.batch, 10);
          if (!isNaN(parsed)) studentData.expectedPassoutYear = parsed;
        }

        if (Object.keys(studentData).length > 0) {
          if (user.studentDetails) {
            await tx.studentDetails.updateMany({
              where: { userId },
              data: studentData,
            });
          } else {
            await tx.studentDetails.create({
              data: {
                userId,
                branch: dto.branch || 'CSE',
                currentYear: 4,
                expectedPassoutYear: parseInt(dto.batch || '2027', 10) || 2027,
              },
            });
          }
        }
      }
    });

    const refreshed = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentDetails: true,
        alumniDetails: true,
        mentorProfile: true,
      },
    });

    const { passwordHash, refreshTokenHash, ...safe } = refreshed || user;
    return safe;
  }

  /**
   * Upload Profile Picture to S3
   */
  async uploadProfilePicture(
    userId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const url = await this.storageService.uploadFile(file, 'avatars');

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicUrl: url },
    });

    return { profilePicUrl: url };
  }

  /**
   * Upload X25519 Public Key for E2E Encryption
   */
  async savePublicKey(userId: string, dto: UploadPublicKeyDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { publicKey: dto.publicKey },
    });

    return { message: 'Public key updated successfully' };
  }

  /**
   * Fetch another user's public key so client can derive shared secret
   */
  async getPublicKey(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, publicKey: true },
    });

    if (!user) {
      throw new NotFoundException('Target user not found');
    }

    if (!user.publicKey) {
      throw new BadRequestException(
        'User has not initialized end-to-end encryption keys on their device yet.',
      );
    }

    return {
      userId: user.id,
      publicKey: user.publicKey,
    };
  }

  /**
   * Register user active heartbeat (keeps presence online)
   */
  async heartbeat(userId: string) {
    await this.redisService.set(`user:${userId}:status`, 'online', 45);
    await this.redisService.set(`user:${userId}:last_seen`, new Date().toISOString());
    return { success: true, timestamp: new Date().toISOString() };
  }

  /**
   * Get user presence (online/offline & last seen)
   */
  async getPresence(targetUserId: string, requestingUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, hideLastSeen: true, updatedAt: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const isOnline = await this.redisService.isUserOnline(targetUserId);
    let lastSeenStr: string | null = null;

    if (targetUserId === requestingUserId || !targetUser.hideLastSeen) {
      const rawLastSeen =
        (await this.redisService.getLastSeen(targetUserId)) ||
        targetUser.updatedAt?.toISOString() ||
        null;
      if (rawLastSeen && !isOnline) {
        const diffMs = Date.now() - new Date(rawLastSeen).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
          lastSeenStr = 'Last seen just now';
        } else if (diffMins < 60) {
          lastSeenStr = `Last seen ${diffMins}m ago`;
        } else if (diffHours < 24) {
          lastSeenStr = `Last seen ${diffHours}h ago`;
        } else if (diffDays === 1) {
          lastSeenStr = 'Last seen yesterday';
        } else {
          lastSeenStr = `Last seen ${diffDays}d ago`;
        }
      }
    }

    return {
      userId: targetUserId,
      status: isOnline ? 'online' : 'offline',
      online: isOnline,
      lastSeen: isOnline ? 'Online' : lastSeenStr || 'Offline',
    };
  }

  /**
   * View another user's profile with connection-based visibility rules
   */
  async getUserById(targetUserId: string, requestingUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        studentDetails: true,
        alumniDetails: true,
        mentorProfile: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if connected
    const isConnected = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: requestingUserId, receiverId: targetUserId, status: ConnectionStatus.ACCEPTED },
          { requesterId: targetUserId, receiverId: requestingUserId, status: ConnectionStatus.ACCEPTED },
        ],
      },
    });

    const isSelf = targetUserId === requestingUserId;
    const hasFullAccess = isSelf || !!isConnected;

    return {
      id: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
      profilePicUrl: targetUser.profilePicUrl,
      city: targetUser.city,
      bio: targetUser.bio,
      studentDetails: targetUser.studentDetails,
      alumniDetails: targetUser.alumniDetails,
      mentorProfile: targetUser.mentorProfile,
      isConnected: !!isConnected,
      // Sensitive contact fields only shown if connected or self
      email: hasFullAccess ? targetUser.email : undefined,
      mobile: hasFullAccess ? targetUser.mobile : undefined,
    };
  }

  /**
   * Search and filter alumni and students
   */
  async searchUsers(query: SearchUsersQueryDto) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { bio: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.branch) {
      where.OR = [
        ...(where.OR || []),
        { studentDetails: { branch: { contains: query.branch, mode: 'insensitive' } } },
        { alumniDetails: { branch: { contains: query.branch, mode: 'insensitive' } } },
      ];
    }

    const alumniFilter: Prisma.AlumniDetailsWhereInput = {};
    if (query.batch) {
      alumniFilter.batch = { contains: query.batch, mode: 'insensitive' };
    }
    if (query.passoutYear) {
      alumniFilter.passoutYear = query.passoutYear;
    }
    if (query.company) {
      alumniFilter.currentCompany = { contains: query.company, mode: 'insensitive' };
    }
    if (Object.keys(alumniFilter).length > 0) {
      where.alumniDetails = { is: alumniFilter };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePicUrl: true,
          city: true,
          bio: true,
          studentDetails: true,
          alumniDetails: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Register Device Token for FCM
   */
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: {
        userId_fcmToken: {
          userId,
          fcmToken: dto.fcmToken,
        },
      },
      update: {
        platform: dto.platform,
      },
      create: {
        userId,
        fcmToken: dto.fcmToken,
        platform: dto.platform,
      },
    });

    return { message: 'Device token registered successfully' };
  }

  /**
   * Permanently delete user account and all associated data
   */
  async deleteAccount(userId: string) {
    await Promise.all([
      this.prisma.studentDetails.deleteMany({ where: { userId } }),
      this.prisma.alumniDetails.deleteMany({ where: { userId } }),
      this.prisma.mentorProfile.deleteMany({ where: { userId } }),
      this.prisma.connection.deleteMany({ where: { OR: [{ requesterId: userId }, { receiverId: userId }] } }),
      this.prisma.mentorshipRequest.deleteMany({ where: { OR: [{ mentorId: userId }, { studentId: userId }] } }),
      this.prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.deviceToken.deleteMany({ where: { userId } }),
    ]);
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }
}
