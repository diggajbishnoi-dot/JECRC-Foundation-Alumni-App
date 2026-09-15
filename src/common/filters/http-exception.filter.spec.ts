import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter (P1-007)', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should preserve standard NestJS HttpExceptions (e.g. BadRequestException)', () => {
    const exception = new BadRequestException('Validation failed');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Validation failed',
      }),
    );
  });

  it('should catch Prisma P2002 (Unique constraint) and return 409 Conflict without schema leak', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`email`) in table `users`',
      {
        code: 'P2002',
        clientVersion: '5.22.0',
      },
    );

    filter.catch(prismaError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        error: 'A record with this identifier already exists',
      }),
    );

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.error).not.toContain('users');
    expect(jsonArg.error).not.toContain('P2002');
    expect(jsonArg.error).not.toContain('Prisma');
  });

  it('should catch Prisma P2025 (Record not found) and return 404 Not Found', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record to update not found in table `otp_verifications`',
      {
        code: 'P2025',
        clientVersion: '5.22.0',
      },
    );

    filter.catch(prismaError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Requested record not found',
      }),
    );
  });

  it('should catch Prisma P2003 (Foreign key failed) and return 400 Bad Request', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed on field `userId`',
      {
        code: 'P2003',
        clientVersion: '5.22.0',
      },
    );

    filter.catch(prismaError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Invalid reference to a related record',
      }),
    );
  });

  it('should catch PrismaValidationError and return 400 Bad Request with safe message', () => {
    const prismaError = new Prisma.PrismaClientValidationError(
      'Invalid `prisma.user.create()` invocation. Argument `email` is missing.',
      { clientVersion: '5.22.0' },
    );

    filter.catch(prismaError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Invalid data parameters provided',
      }),
    );
  });

  it('should catch unhandled generic Error and return 500 without stack trace or message leak', () => {
    const error = new Error('Raw SQL error SELECT * FROM users WHERE password_hash = secret');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'An unexpected internal server error occurred',
      }),
    );

    const jsonArg = mockResponse.json.mock.calls[0][0];
    expect(jsonArg.error).not.toContain('SQL');
    expect(jsonArg.error).not.toContain('users');
    expect(jsonArg.error).not.toContain('secret');
  });
});
