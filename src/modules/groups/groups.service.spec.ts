import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupRole, GroupType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockPrisma = {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    groupMembership: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    jest.clearAllMocks();
  });

  it('should create group and automatically assign creator as ADMIN', async () => {
    mockPrisma.group.create.mockResolvedValue({
      id: 'grp-1',
      name: 'Startup Founders',
      type: GroupType.INTEREST,
    });

    const group = await service.createGroup('user-1', {
      name: 'Startup Founders',
      type: GroupType.INTEREST,
    });

    expect(group.id).toBe('grp-1');
    expect(mockPrisma.groupMembership.create).toHaveBeenCalledWith({
      data: {
        groupId: 'grp-1',
        userId: 'user-1',
        role: GroupRole.ADMIN,
      },
    });
  });

  it('should prevent joining a group multiple times', async () => {
    mockPrisma.group.findUnique.mockResolvedValue({ id: 'grp-1' });
    mockPrisma.groupMembership.findUnique.mockResolvedValue({
      id: 'member-1',
      groupId: 'grp-1',
      userId: 'user-1',
    });

    await expect(service.joinGroup('grp-1', 'user-1')).rejects.toThrow(ConflictException);
  });
});
