import { ConfigService } from '@nestjs/config';
export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}
export declare class FcmService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendToDeviceTokens(tokens: string[], payload: PushNotificationPayload): Promise<{
        successCount: number;
        failureCount: number;
    }>;
}
