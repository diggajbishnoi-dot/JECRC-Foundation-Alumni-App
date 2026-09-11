import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MentorshipStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MentorshipService } from './mentorship.service';

describe('MentorshipService', () => {
  let service: MentorshipService;

  const mockPrisma = {
    mentorProfile: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    mentorshipRequest: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    notification: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentorshipService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MentorshipService>(MentorshipService);
    jest.clearAllMocks();
  });

  it('should prevent students from registering as mentors', async () => {
    await expect(
      service.optInAsMentor('student-1', Role.STUDENT, {
        domains: ['Tech'],
        availability: '1 session',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow alumni to register as mentors', async () => {
    mockPrisma.mentorProfile.upsert.mockResolvedValue({
      id: 'mentor-1',
      userId: 'alumni-1',
      domains: ['Distributed Systems'],
    });

    const result = await service.optInAsMentor('alumni-1', Role.ALUMNI, {
      domains: ['Distributed Systems'],
      availability: '2 sessions',
      maxMentees: 4,
    });

    expect(result.id).toBe('mentor-1');
  });

  it('should reject mentorship request if mentor reached max active mentees capacity', async () => {
    mockPrisma.mentorProfile.findUnique.mockResolvedValue({
      userId: 'mentor-1',
      isActive: true,
      maxMentees: 2,
    });
    mockPrisma.mentorshipRequest.count.mockResolvedValue(2); // At capacity!

    await expect(
      service.requestMentorship('student-1', Role.STUDENT, {
        mentorId: 'mentor-1',
        message: 'Please mentor me',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
