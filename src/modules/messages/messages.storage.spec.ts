import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { StorageService } from '../../services/storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';
import { RedisService } from '../../redis/redis.service';
import { FcmService } from '../../services/fcm/fcm.service';

describe('MessagesService Storage (P2-007)', () => {
  let service: MessagesService;
  let mockStorageService: Partial<StorageService>;

  beforeEach(async () => {
    mockStorageService = {
      uploadFile: jest.fn().mockResolvedValue('https://mock-bucket.s3.us-east-1.amazonaws.com/chat/test.png'),
      uploadBase64Image: jest.fn().mockResolvedValue('https://mock-bucket.s3.us-east-1.amazonaws.com/chat/base64test.png'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: PrismaService, useValue: {} },
        { provide: ConnectionsService, useValue: {} },
        { provide: RedisService, useValue: {} },
        { provide: FcmService, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should upload buffer attachment to S3 chat folder', async () => {
    const file = {
      originalname: 'test.png',
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/png',
    };
    const result = await service.uploadAttachment(file);
    expect(mockStorageService.uploadFile).toHaveBeenCalledWith(file, 'chat');
    expect(result).toEqual({ url: 'https://mock-bucket.s3.us-east-1.amazonaws.com/chat/test.png' });
  });

  it('should upload base64 attachment to S3 chat folder', async () => {
    const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await service.uploadBase64Attachment(base64Data, 'test.png');
    expect(mockStorageService.uploadBase64Image).toHaveBeenCalledWith(base64Data, 'chat', 'test.png');
    expect(result).toEqual({ url: 'https://mock-bucket.s3.us-east-1.amazonaws.com/chat/base64test.png' });
  });
});
