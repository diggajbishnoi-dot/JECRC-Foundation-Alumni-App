import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers (CSP disabled to allow Swagger UI and local Web UI assets)
  app.use(helmet({ contentSecurityPolicy: false }));

  // Serve static Frontend UI from /public
  app.use(express.static(join(process.cwd(), 'public')));

  // CORS Configuration (Permissive for mobile client apps and dev)
  const allowedOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: allowedOrigin === '*' ? true : allowedOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API Prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe with automatic type transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Interceptor and Exception Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Alumni Networking App — Backend API')
    .setDescription(
      'Enterprise REST and Real-Time WebSocket API for college alumni networking with LinkedIn-style connections and WhatsApp/Signal-style End-to-End Encrypted messaging for Flutter mobile clients.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT',
    )
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

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Alumni Network API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(` Alumni Networking Backend running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(` Interactive Swagger Docs available at: http://localhost:${port}/api/docs`);
  logger.log(` Real-time Chat WebSocket Gateway namespace: /chat`);
  logger.log(`=======================================================`);
}

bootstrap();
