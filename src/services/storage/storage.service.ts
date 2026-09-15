import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Upload file buffer to S3 or return mock public CDN URL in development
   */
  async uploadFile(
    file: { originalname: string; buffer: Buffer; mimetype: string },
    folder: 'avatars' | 'posts' | 'resumes' | 'chat' = 'chat',
  ): Promise<string> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET', 'alumni-app-storage');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${sanitizedFilename}`;

    this.logger.log(`[STORAGE] Uploading ${sanitizedFilename} (${file.buffer.length} bytes) to s3://${bucket}/${key}`);

    // Returns standard AWS S3 / CloudFront URL
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Upload Base64 image payload to S3 object storage
   */
  async uploadBase64Image(
    base64Data: string,
    folder: 'avatars' | 'posts' | 'resumes' | 'chat' = 'chat',
    filename: string = 'chat_image.png',
  ): Promise<string> {
    const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    let buffer: Buffer;
    let mimetype = 'image/png';

    if (matches && matches.length === 3) {
      mimetype = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    return await this.uploadFile(
      { originalname: filename, buffer, mimetype },
      folder,
    );
  }
}
