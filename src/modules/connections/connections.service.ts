import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { ConnectionStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject('MESSAGES_GATEWAY')
    private readonly messagesGateway?: any,
  ) {}

  /**
   * Send Connection Request
   */
  async sendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) {
      throw new BadRequestException('You cannot send a connection request to yourself');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver user not found');
    }

    // Check existing connection in either direction
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === ConnectionStatus.ACCEPTED) {
        throw new ConflictException('You are already connected with this user');
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new ConflictException('A connection request is already pending between both of you');
      }
      // If previously rejected, re-open as PENDING
      const updated = await this.prisma.connection.update({
        where: { id: existing.id },
        data: {
          requesterId,
          receiverId,
          status: ConnectionStatus.PENDING,
        },
      });

      // Create notification
      await this.prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'CONNECTION_REQUEST',
          payload: { requesterId, connectionId: updated.id },
        },
      });

      this.messagesGateway?.notifyConnectionRequest(receiverId, { requesterId, connectionId: updated.id });

      return updated;
    }

    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        status: ConnectionStatus.PENDING,
      },
    });

    // Create in-app notification
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        payload: { requesterId, connectionId: connection.id },
      },
    });

    this.messagesGateway?.notifyConnectionRequest(receiverId, { requesterId, connectionId: connection.id });

    return connection;
  }

  /**
   * Accept Connection Request
   */
  async acceptRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.receiverId !== userId) {
      throw new ForbiddenException('Only the recipient can accept this connection request');
    }

    if (connection.status === ConnectionStatus.ACCEPTED) {
      return connection;
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.ACCEPTED },
    });

    // Notify requester that request was accepted
    await this.prisma.notification.create({
      data: {
        userId: connection.requesterId,
        type: 'CONNECTION_ACCEPTED',
        payload: { acceptedByUserId: userId, connectionId },
      },
    });

    this.messagesGateway?.notifyConnectionAccepted(connection.requesterId, { acceptedByUserId: userId, connectionId });

    return updated;
  }

  /**
   * Reject Connection Request
   */
  async rejectRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.receiverId !== userId) {
      throw new ForbiddenException('Only the recipient can reject this request');
    }

    return await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.REJECTED },
    });
  }

  /**
   * Remove or cancel an existing connection
   */
  async removeConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      throw new ForbiddenException('You cannot delete a connection you are not part of');
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection removed successfully' };
  }

  /**
   * List all accepted connections for current user
   */
  async getAcceptedConnections(userId: string, pagination: PaginationQueryDto) {
    const where = {
      status: ConnectionStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { receiverId: userId }],
    };

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePicUrl: true,
              alumniDetails: true,
              studentDetails: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePicUrl: true,
              alumniDetails: true,
              studentDetails: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.connection.count({ where }),
    ]);

    // Format so the connected peer is always directly accessible
    const items = connections.map((conn) => {
      const peer = conn.requesterId === userId ? conn.receiver : conn.requester;
      return {
        connectionId: conn.id,
        connectedSince: conn.updatedAt,
        peer,
      };
    });

    return {
      items,
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  /**
   * List pending incoming requests
   */
  async getPendingRequests(userId: string) {
    return await this.prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: ConnectionStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePicUrl: true,
            alumniDetails: true,
            studentDetails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List pending sent requests
   */
  async getSentRequests(userId: string) {
    return await this.prisma.connection.findMany({
      where: {
        requesterId: userId,
        status: ConnectionStatus.PENDING,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePicUrl: true,
            alumniDetails: true,
            studentDetails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if two users have an accepted connection or active mentorship
   */
  async areConnected(userAId: string, userBId: string): Promise<boolean> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { requesterId: userAId, receiverId: userBId },
          { requesterId: userBId, receiverId: userAId },
        ],
      },
    });

    if (connection) return true;

    // Check active mentorship
    const mentorship = await this.prisma.mentorshipRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { studentId: userAId, mentorId: userBId },
          { studentId: userBId, mentorId: userAId },
        ],
      },
    });

    return !!mentorship;
  }
}
