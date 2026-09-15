import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';
import { RedisService } from '../../redis/redis.service';

/**
 * P0-005 — WebSocket CORS policy tests
 *
 * Verifies that afterInit() correctly configures the Socket.io engine's
 * CORS origin handler for production (restricted) and development (open).
 */
describe('MessagesGateway — WebSocket CORS policy', () => {
  let gateway: MessagesGateway;

  const mockMessagesService = { sendMessage: jest.fn(), markDelivered: jest.fn(), markRead: jest.fn() };
  const mockJwtService = { verify: jest.fn() };
  const mockRedisService = { setUserOnline: jest.fn(), setUserOffline: jest.fn(), getFailedAttempts: jest.fn(), incrementFailedAttempts: jest.fn(), resetFailedAttempts: jest.fn() };

  /** Build a gateway with a specific CORS_ORIGIN env value */
  async function buildGateway(corsOrigin: string): Promise<MessagesGateway> {
    const mockConfigService = {
      get: jest.fn((key: string, def?: string) =>
        key === 'CORS_ORIGIN' ? corsOrigin : key === 'JWT_SECRET' ? 'test-secret' : def,
      ),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        throw new Error('Missing required env var: ' + key);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    return module.get<MessagesGateway>(MessagesGateway);
  }

  /** Simulate the cors.origin callback from the engine opts */
  function getCorsCallback(server: any): (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void {
    return server.engine.opts.cors.origin;
  }

  /** Build a mock Socket.io Server with a spy engine */
  function mockServer() {
    const corsHandlers: Function[] = [];
    return {
      engine: {
        on: jest.fn(),
        opts: { cors: { origin: true, credentials: true } }, // default wildcard before afterInit
      },
    };
  }

  afterEach(() => jest.clearAllMocks());

  // ─── Production: single trusted origin ─────────────────────────────────

  it('PROD single origin: allows the configured trusted origin', async () => {
    gateway = await buildGateway('https://alumni.jecrcfoundation.com');
    const server = mockServer() as any;
    gateway.afterInit(server);

    const originFn = getCorsCallback(server);
    await new Promise<void>((resolve) => {
      originFn('https://alumni.jecrcfoundation.com', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        resolve();
      });
    });
  });

  it('PROD single origin: blocks an untrusted origin', async () => {
    gateway = await buildGateway('https://alumni.jecrcfoundation.com');
    const server = mockServer() as any;
    gateway.afterInit(server);

    const originFn = getCorsCallback(server);
    await new Promise<void>((resolve) => {
      originFn('https://evil.com', (err, allow) => {
        expect(err).toBeInstanceOf(Error);
        expect(allow).toBeUndefined();
        resolve();
      });
    });
  });

  // ─── Production: multiple trusted origins ───────────────────────────────

  it('PROD multiple origins: allows each configured origin', async () => {
    gateway = await buildGateway('https://alumni.jecrcfoundation.com,https://staging.alumni.jecrc.ac.in');
    const server = mockServer() as any;
    gateway.afterInit(server);

    const originFn = getCorsCallback(server);

    for (const trusted of ['https://alumni.jecrcfoundation.com', 'https://staging.alumni.jecrc.ac.in']) {
      await new Promise<void>((resolve) => {
        originFn(trusted, (err, allow) => {
          expect(err).toBeNull();
          expect(allow).toBe(true);
          resolve();
        });
      });
    }
  });

  it('PROD multiple origins: blocks origin not in the list', async () => {
    gateway = await buildGateway('https://alumni.jecrcfoundation.com,https://staging.alumni.jecrc.ac.in');
    const server = mockServer() as any;
    gateway.afterInit(server);

    const originFn = getCorsCallback(server);
    await new Promise<void>((resolve) => {
      originFn('https://attacker.io', (err) => {
        expect(err).toBeInstanceOf(Error);
        resolve();
      });
    });
  });

  // ─── Production: non-browser clients (native app) ───────────────────────

  it('PROD: allows connections with no origin header (native mobile app)', async () => {
    gateway = await buildGateway('https://alumni.jecrcfoundation.com');
    const server = mockServer() as any;
    gateway.afterInit(server);

    const originFn = getCorsCallback(server);
    await new Promise<void>((resolve) => {
      originFn(undefined, (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        resolve();
      });
    });
  });

  // ─── Development: wildcard ──────────────────────────────────────────────

  it('DEV wildcard (*): cors.origin is set to boolean true (allow all)', async () => {
    gateway = await buildGateway('*');
    const server = mockServer() as any;
    gateway.afterInit(server);

    // In wildcard mode the value is true (not a function)
    expect(server.engine.opts.cors.origin).toBe(true);
    expect(server.engine.opts.cors.credentials).toBe(true);
  });
});
