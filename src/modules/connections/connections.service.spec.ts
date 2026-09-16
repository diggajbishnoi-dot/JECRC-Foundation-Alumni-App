import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectionsService } from './connections.service';

import { MessagesGateway } from '../messages/messages.gateway';

describe('ConnectionsService', () => {
  let service: ConnectionsService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    connection: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification: { create: jest.fn() },
    mentorshipRequest: { findFirst: jest.fn() },
  };

  const mockMessagesGateway = {
    notifyConnectionRequest: jest.fn(),
    notifyConnectionAccepted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
    jest.clearAllMocks();
  });

  it('should prevent sending connection request to oneself', async () => {
    await expect(service.sendRequest('user-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('should send a connection request and notify receiver', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    mockPrisma.connection.findFirst.mockResolvedValue(null);
    mockPrisma.connection.create.mockResolvedValue({
      id: 'conn-1',
      requesterId: 'user-1',
      receiverId: 'user-2',
      status: ConnectionStatus.PENDING,
    });

    const result = await service.sendRequest('user-1', 'user-2');

    expect(result.id).toBe('conn-1');
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-2',
          type: 'CONNECTION_REQUEST',
        }),
      }),
    );
  });

  it('should prevent duplicate pending connection requests', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    mockPrisma.connection.findFirst.mockResolvedValue({
      id: 'conn-1',
      status: ConnectionStatus.PENDING,
    });

    await expect(service.sendRequest('user-1', 'user-2')).rejects.toThrow(ConflictException);
  });
});
