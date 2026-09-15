import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { GlobalThrottlerGuard } from './common/guards/global-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { OtpModule } from './services/otp/otp.module';
import { StorageModule } from './services/storage/storage.module';
import { FcmModule } from './services/fcm/fcm.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PostsModule } from './modules/posts/posts.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { GroupsModule } from './modules/groups/groups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    OtpModule,
    StorageModule,
    FcmModule,
    AuthModule,
    UsersModule,
    ConnectionsModule,
    MessagesModule,
    PostsModule,
    DiscussionsModule,
    MentorshipModule,
    GroupsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
  ],
})
export class AppModule {}
