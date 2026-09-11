import { Test, TestingModule } from '@nestjs/testing';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { FcmService } from '../../services/fcm/fcm.service';
import { ConnectionsService } from '../connections/connections.service';
import { MessagesService } from './messages.service';

describe('Messages E2E Zero-Knowledge Ciphertext Invariant Test', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  const sampleCiphertext = '5a4b3c2d1e0f==[ENCRYPTED_X25519_PAYLOAD]==';
  const sampleNonce = 'YWJjZGVmZ2hpamtsbW5vcA==';
  const secretPlaintextThatMustNeverBeStored = 'Confidential personal chat message from alumni';

  const mockPrisma = {
    message: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 'msg-uuid-1',
        ...data,
        createdAt: new Date(),
      })),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ name: 'Sender Name' }),
    },
    deviceToken: {
      findMany: jest.fn().mockResolvedValue([{ fcmToken: 'token-123' }]),
    },
  };

  const mockConnectionsService = {
    areConnected: jest.fn().mockResolvedValue(true),
  };

  const mockRedisService = {
    isUserOnline: jest.fn().mockResolvedValue(false), // triggers push notification path
  };

  const mockFcmService = {
    sendToDeviceTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConnectionsService, useValue: mockConnectionsService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: FcmService, useValue: mockFcmService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('MUST persist ONLY ciphertext and nonce to the database, never plaintext', async () => {
    const result = await service.sendMessage('sender-1', {
      receiverId: 'receiver-2',
      encryptedContent: sampleCiphertext,
      nonce: sampleNonce,
    });

    // Verify DB call arguments
    const createCallArgs = mockPrisma.message.create.mock.calls[0][0];

    expect(createCallArgs.data.encryptedContent).toBe(sampleCiphertext);
    expect(createCallArgs.data.nonce).toBe(sampleNonce);
    expect(createCallArgs.data).not.toHaveProperty('plaintext');
    expect(createCallArgs.data).not.toHaveProperty('content');

    // Confirm stored ciphertext is returned
    expect(result.encryptedContent).toBe(sampleCiphertext);
    expect(result.encryptedContent).not.toContain(secretPlaintextThatMustNeverBeStored);
  });

  it('MUST NOT include message content or ciphertext in offline FCM push notifications', async () => {
    await service.sendMessage('sender-1', {
      receiverId: 'receiver-2',
      encryptedContent: sampleCiphertext,
      nonce: sampleNonce,
    });

    expect(mockFcmService.sendToDeviceTokens).toHaveBeenCalled();
    const pushCall = mockFcmService.sendToDeviceTokens.mock.calls[0];
    const pushPayload = pushCall[1];

    // Notification body must be generic (e.g. "New message from Sender Name")
    expect(pushPayload.body).toBe('New message from Sender Name');
    expect(pushPayload.body).not.toContain(sampleCiphertext);
    expect(pushPayload.body).not.toContain(secretPlaintextThatMustNeverBeStored);

    // Data payload must NEVER contain message content or ciphertext
    if (pushPayload.data) {
      expect(pushPayload.data.encryptedContent).toBeUndefined();
      expect(pushPayload.data.content).toBeUndefined();
    }
  });
});
