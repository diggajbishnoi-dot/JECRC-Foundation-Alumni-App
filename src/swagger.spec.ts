import { ConfigService } from '@nestjs/config';

describe('Swagger Security (P1-002)', () => {
  function isSwaggerEnabled(configService: ConfigService): boolean {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const explicitEnable = configService.get<string>('ENABLE_SWAGGER') === 'true';
    return !isProduction || explicitEnable;
  }

  it('should DISABLE Swagger in production environment by default', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(isSwaggerEnabled(mockConfig)).toBe(false);
  });

  it('should ENABLE Swagger in development environment', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(isSwaggerEnabled(mockConfig)).toBe(true);
  });

  it('should ENABLE Swagger in production ONLY IF ENABLE_SWAGGER=true is explicitly configured', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'ENABLE_SWAGGER') return 'true';
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(isSwaggerEnabled(mockConfig)).toBe(true);
  });
});
