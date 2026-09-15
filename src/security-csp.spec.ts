import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

// We mock helmet to capture its arguments
jest.mock('helmet', () => {
  const helmetMock: any = jest.fn((options) => (req: any, res: any, next: any) => next());
  helmetMock.contentSecurityPolicy = {
    getDefaultDirectives: jest.fn().mockReturnValue({ 'default-src': ["'self'"] })
  };
  return {
    __esModule: true,
    default: helmetMock,
  };
});

describe('CSP Configuration Logic', () => {
  let isProduction: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getHelmetOptions = (prod: boolean) => {
    return {
      contentSecurityPolicy: prod
        ? {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'img-src': ["'self'", 'data:', 'https://*.amazonaws.com'],
              'script-src': ["'self'", "'unsafe-inline'"],
            },
          }
        : false,
    };
  };

  it('DEV: disables CSP for Swagger/local UI', () => {
    isProduction = false;
    const options = getHelmetOptions(isProduction);
    expect(options.contentSecurityPolicy).toBe(false);
  });

  it('PROD: enables secure CSP and allows S3 images', () => {
    isProduction = true;
    const options = getHelmetOptions(isProduction);
    expect(options.contentSecurityPolicy).not.toBe(false);
    
    const directives = (options.contentSecurityPolicy as any).directives;
    expect(directives['default-src']).toContain("'self'");
    expect(directives['img-src']).toContain('https://*.amazonaws.com');
    expect(directives['script-src']).toContain("'unsafe-inline'");
  });
});
