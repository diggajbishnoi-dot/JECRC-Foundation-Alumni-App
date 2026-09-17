import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res['message'] ? res['message'] : res;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma Known Error [${exception.code}]: ${exception.message}`);

      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A record with this identifier already exists';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Requested record not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference to a related record';
          break;
        case 'P2000':
          status = HttpStatus.BAD_REQUEST;
          message = 'Provided value is out of acceptable range';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed due to invalid data';
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma Validation Error: ${exception.message}`);
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data parameters provided';
    } else if (
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      this.logger.error(`Prisma Engine/Connection Error: ${(exception as Error).message}`);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database service unavailable';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected internal server error occurred';
    }

    let cleanErrorMessage = 'Error occurred';
    if (Array.isArray(message)) {
      cleanErrorMessage = message.join(', ');
    } else if (typeof message === 'object' && message !== null) {
      cleanErrorMessage = (message as any).message || JSON.stringify(message);
    } else {
      cleanErrorMessage = String(message || 'Error occurred');
    }

    if (cleanErrorMessage.includes('encryptedContent')) {
      cleanErrorMessage = 'Cryptographic message operation failed';
    }

    response.status(status).json({
      success: false,
      error: cleanErrorMessage,
      message: cleanErrorMessage,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}

