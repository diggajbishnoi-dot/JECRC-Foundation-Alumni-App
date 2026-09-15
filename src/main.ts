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
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Security Headers
  // In development, disable CSP to easily allow Swagger UI and local Web UI assets.
  // In production, enforce a secure CSP while allowing necessary assets like S3 images.
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'img-src': ["'self'", 'data:', 'https://*.amazonaws.com'],
              'script-src': ["'self'", "'unsafe-inline'"],
            },
          }
        : false,
    }),
  );

  // Serve static Frontend UI from /public
  app.use(express.static(join(process.cwd(), 'public')));

  // HTTP CORS Configuration
  // ─────────────────────────────────────────────────────────────────────────
  // CORS_ORIGIN controls which browser origins may call the API.
  // Set it to a comma-separated list of trusted URLs in production:
  //   CORS_ORIGIN=https://alumni.jecrcfoundation.com
  //   CORS_ORIGIN=https://alumni.jecrcfoundation.com,https://staging.jecrc.ac.in
  //
  // In development (NODE_ENV != 'production') a wildcard '*' is accepted as a
  // convenience default. In production an unset/wildcard value is a
  // misconfiguration — all cross-origin requests are blocked and an error is
  // logged at startup so the problem is immediately visible.
  // ─────────────────────────────────────────────────────────────────────────
  const rawCorsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const isWildcard = rawCorsOrigin.trim() === '*';

  let corsOriginOption: boolean | string | string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);

  if (isWildcard && isProduction) {
    // Misconfigured production — block all cross-origin requests and warn loudly
    logger.error(
      'CORS_ORIGIN is not configured for production. ' +
      'All cross-origin requests will be BLOCKED. ' +
      'Set CORS_ORIGIN=https://<your-frontend-domain> in your production environment.',
    );
    corsOriginOption = false; // block every cross-origin request
  } else if (isWildcard) {
    // Development convenience — allow all origins
    corsOriginOption = true;
  } else {
    // Explicitly configured origins — allow only the listed ones
    const allowedOrigins = rawCorsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    corsOriginOption = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Non-browser clients (mobile app, Postman, server-to-server) send no Origin header
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin '${origin}' is not allowed by CORS policy`));
      }
    };
    logger.log(`HTTP CORS: allowing origins [${allowedOrigins.join(', ')}]`);
  }

  app.enableCors({
    origin: corsOriginOption,
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
  const enableSwagger = !isProduction || configService.get<string>('ENABLE_SWAGGER') === 'true';
  if (enableSwagger) {
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
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(` Alumni Networking Backend running on: http://localhost:${port}/${apiPrefix}`);
  if (enableSwagger) {
    logger.log(` Interactive Swagger Docs available at: http://localhost:${port}/api/docs`);
  } else {
    logger.log(` Swagger Docs DISABLED in production environment`);
  }
  logger.log(` Real-time Chat WebSocket Gateway namespace: /chat`);
  logger.log(`=======================================================`);
}

bootstrap();
