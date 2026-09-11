import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    uploadFile(file: {
        originalname: string;
        buffer: Buffer;
        mimetype: string;
    }, folder?: 'avatars' | 'posts' | 'resumes'): Promise<string>;
}
