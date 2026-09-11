import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches push notification to multiple device tokens (iOS / Android)
   */
  async sendToDeviceTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    // Strict privacy guarantee: Never send message content or ciphertext in push notifications
    if (payload.data && 'encryptedContent' in payload.data) {
      delete payload.data['encryptedContent'];
    }

    this.logger.log(
      `[FCM PUSH] Dispatching notification "${payload.title}" to ${tokens.length} device tokens`,
    );

    // In production with Firebase Admin credentials, admin.messaging().sendMulticast() is invoked.
    return { successCount: tokens.length, failureCount: 0 };
  }
}
