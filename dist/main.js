"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const express = require("express");
const path_1 = require("path");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use(express.static((0, path_1.join)(process.cwd(), 'public')));
    const allowedOrigin = configService.get('CORS_ORIGIN', '*');
    app.enableCors({
        origin: allowedOrigin === '*' ? true : allowedOrigin.split(','),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Alumni Networking App — Backend API')
        .setDescription('Enterprise REST and Real-Time WebSocket API for college alumni networking with LinkedIn-style connections and WhatsApp/Signal-style End-to-End Encrypted messaging for Flutter mobile clients.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
    }, 'JWT')
        .addTag('Authentication', 'One-time OTP verification & password login')
        .addTag('Users & Profiles', 'Student & Alumni directories, public keys, and avatars')
        .addTag('Connections', 'LinkedIn-style connect requests & friends list')
        .addTag('Messages & Chat', 'End-to-End encrypted chat history & status receipts')
        .addTag('Posts & Jobs', 'Job & internship board with feed filtering')
        .addTag('Discussions & Idea Board', 'Open discussion forum with upvotes & replies')
        .addTag('Mentorship Matching', 'Alumni mentors & student matching')
        .addTag('Affinity Groups', 'Batch-wise & interest-based groups')
        .addTag('Notifications', 'In-app and FCM push notifications')
        .addTag('Admin Panel', 'Alumni approval, spam moderation, and metrics')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Alumni Network API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    logger.log(`=======================================================`);
    logger.log(` Alumni Networking Backend running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(` Interactive Swagger Docs available at: http://localhost:${port}/api/docs`);
    logger.log(` Real-time Chat WebSocket Gateway namespace: /chat`);
    logger.log(`=======================================================`);
}
bootstrap();
//# sourceMappingURL=main.js.map