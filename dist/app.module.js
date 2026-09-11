"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const otp_module_1 = require("./services/otp/otp.module");
const storage_module_1 = require("./services/storage/storage.module");
const fcm_module_1 = require("./services/fcm/fcm.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const connections_module_1 = require("./modules/connections/connections.module");
const messages_module_1 = require("./modules/messages/messages.module");
const posts_module_1 = require("./modules/posts/posts.module");
const discussions_module_1 = require("./modules/discussions/discussions.module");
const mentorship_module_1 = require("./modules/mentorship/mentorship.module");
const groups_module_1 = require("./modules/groups/groups.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            otp_module_1.OtpModule,
            storage_module_1.StorageModule,
            fcm_module_1.FcmModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            connections_module_1.ConnectionsModule,
            messages_module_1.MessagesModule,
            posts_module_1.PostsModule,
            discussions_module_1.DiscussionsModule,
            mentorship_module_1.MentorshipModule,
            groups_module_1.GroupsModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map