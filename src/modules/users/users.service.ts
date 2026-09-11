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
      include: { alumniDetails: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const userUpdate: Prisma.UserUpdateInput = {};
      if (dto.bio !== undefined) userUpdate.bio = dto.bio;
      if (dto.city !== undefined) userUpdate.city = dto.city;
      if (dto.hideLastSeen !== undefined) userUpdate.hideLastSeen = dto.hideLastSeen;

      const res = await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      });

      if (
        user.role === Role.ALUMNI &&
        (dto.currentCompany || dto.designation)
      ) {
        await tx.alumniDetails.updateMany({
          where: { userId },
          data: {
            ...(dto.currentCompany && { currentCompany: dto.currentCompany }),
            ...(dto.designation && { designation: dto.designation }),
          },
        });
      }

      return res;
    });

    const { passwordHash, refreshTokenHash, ...safe } = updated;
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
   * Get user presence (online/offline & last seen)
   */
  async getPresence(targetUserId: string, requestingUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, hideLastSeen: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const isOnline = await this.redisService.isUserOnline(targetUserId);
    let lastSeen: string | null = null;

    // Respect privacy setting: don't reveal last seen if hidden and not self
    if (targetUserId === requestingUserId || !targetUser.hideLastSeen) {
      lastSeen = await this.redisService.getLastSeen(targetUserId);
    }

    return {
      userId: targetUserId,
      status: isOnline ? 'online' : 'offline',
      lastSeen,
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
