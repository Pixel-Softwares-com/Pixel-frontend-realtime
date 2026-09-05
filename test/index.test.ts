import { describe, expect, it, vi } from 'vitest';
import {
  createNotificationsApi,
  createRealtimeClient,
  createReverbEchoConfig,
  privateScopedChannel,
  privateUserChannel,
  scopedChannel,
  userChannel,
  type EchoLike,
} from '../src/index';

class FakeEchoChannel {
  listeners = new Map<string, (payload: unknown) => void>();
  stopped: string[] = [];

  listen(event: string, callback: (payload: unknown) => void): FakeEchoChannel {
    this.listeners.set(event, callback);
    return this;
  }

  stopListening(event: string): FakeEchoChannel {
    this.stopped.push(event);
    this.listeners.delete(event);
    return this;
  }

  emit(event: string, payload: unknown): void {
    const listener = this.listeners.get(event);

    if (!listener) {
      throw new Error(`No listener for ${event}`);
    }

    listener(payload);
  }
}

class FakeEcho implements EchoLike {
  channels = new Map<string, FakeEchoChannel>();
  left: string[] = [];

  private(channel: string): FakeEchoChannel {
    const existing = this.channels.get(channel);

    if (existing) {
      return existing;
    }

    const created = new FakeEchoChannel();
    this.channels.set(channel, created);
    return created;
  }

  leave(channel: string): void {
    this.left.push(channel);
  }
}

describe('channels', () => {
  it('builds echo and wire user channel names', () => {
    expect(userChannel(15)).toBe('user.15');
    expect(privateUserChannel(15)).toBe('private-user.15');
  });

  it('builds scoped channel names per guard', () => {
    expect(scopedChannel('admin', 15)).toBe('admin.15');
    expect(scopedChannel('users', 15)).toBe('users.15');
    expect(privateScopedChannel('admin', 15)).toBe('private-admin.15');
  });

  it('rejects an empty scope', () => {
    expect(() => scopedChannel('', 15)).toThrow(/scope/i);
  });
});

describe('createRealtimeClient with guard', () => {
  it('listens on the guard-scoped channel when guard is provided', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, userId: 5, guard: 'admin' });
    const handler = vi.fn();

    const subscription = client.notifications.listen(handler);

    expect(subscription.channel).toBe('admin.5');
    expect(subscription.wireChannel).toBe('private-admin.5');
    expect(echo.channels.has('admin.5')).toBe(true);
  });

  it('overrides the guard per call when one is passed to listen()', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, userId: 5, guard: 'admin' });
    const handler = vi.fn();

    const subscription = client.notifications.listen(handler, 5, 'users');

    expect(subscription.channel).toBe('users.5');
    expect(subscription.wireChannel).toBe('private-users.5');
  });
});

describe('createReverbEchoConfig', () => {
  it('builds Echo config for Reverb', () => {
    expect(
      createReverbEchoConfig({
        key: 'app-key',
        host: 'reverb.test',
        port: 6001,
        scheme: 'https',
        authEndpoint: '/broadcasting/auth',
        tokenProvider: () => 'jwt-token',
      }),
    ).toMatchObject({
      broadcaster: 'reverb',
      key: 'app-key',
      wsHost: 'reverb.test',
      wsPort: 6001,
      wssPort: 6001,
      forceTLS: true,
      enabledTransports: ['wss'],
      authEndpoint: '/broadcasting/auth',
      auth: {
        headers: {
          Authorization: 'Bearer jwt-token',
        },
      },
    });
  });

  it('passes auth params through to pusher-js alongside the token headers', () => {
    const config = createReverbEchoConfig({
      key: 'app-key',
      tokenProvider: () => 'jwt-token',
      auth: { params: { tenant: 'acme' } },
    });

    expect(config.auth?.params).toEqual({ tenant: 'acme' });
    expect(config.auth?.headers).toEqual({ Authorization: 'Bearer jwt-token' });
  });

  it('re-reads auth params on every request instead of freezing them at construction', () => {
    let viewAs = 'committee_member';
    const config = createReverbEchoConfig({
      key: 'app-key',
      tokenProvider: () => 'jwt-token',
      auth: { paramsProvider: () => ({ view_as: viewAs }) },
    });

    expect(config.auth?.paramsProvider?.()).toEqual({ view_as: 'committee_member' });

    viewAs = 'committee_team_leader';

    expect(config.auth?.paramsProvider?.()).toEqual({ view_as: 'committee_team_leader' });
  });

  it('carries auth params even when no token provider is given', () => {
    const config = createReverbEchoConfig({ key: 'app-key', auth: { params: { tenant: 'acme' } } });

    expect(config.auth?.params).toEqual({ tenant: 'acme' });
    expect(config.auth?.headers).toBeUndefined();
  });

  it('re-reads the token on every auth request instead of freezing it at construction', () => {
    let token = 'old-token';
    const config = createReverbEchoConfig({ key: 'app-key', tokenProvider: () => token });

    expect(config.auth?.headers).toEqual({ Authorization: 'Bearer old-token' });

    token = 'new-token';

    expect(config.auth?.headersProvider?.()).toEqual({ Authorization: 'Bearer new-token' });
  });

  it('resolves the token even when it is missing at construction', () => {
    let token: string | null = null;
    const config = createReverbEchoConfig({ key: 'app-key', tokenProvider: () => token });

    expect(config.auth?.headers).toEqual({});

    token = 'token-after-login';

    expect(config.auth?.headersProvider?.()).toEqual({ Authorization: 'Bearer token-after-login' });
  });

  it('keeps caller-supplied headers and omits the provider when there is no tokenProvider', () => {
    const config = createReverbEchoConfig({
      key: 'app-key',
      auth: { headers: { 'X-Tenant': 'acme' } },
    });

    expect(config.auth).toEqual({ headers: { 'X-Tenant': 'acme' } });
  });

  it('defaults authEndpoint to /broadcasting/auth and never includes a secret', () => {
    const config = createReverbEchoConfig({
      key: 'app-key',
      host: '127.0.0.1',
      port: 8080,
      scheme: 'http',
    });

    expect(config.authEndpoint).toBe('/broadcasting/auth');

    const serialized = JSON.stringify(config).toLowerCase();
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('app_secret');
    expect(serialized).not.toContain('appsecret');

    expect(Object.keys(config)).not.toContain('secret');
    expect(Object.keys(config)).not.toContain('appSecret');
    expect(Object.keys(config)).not.toContain('app_secret');
  });
});

describe('createRealtimeClient', () => {
  it('listens for user notifications through Echo', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, userId: 15 });
    const handler = vi.fn();

    const subscription = client.notifications.listen(handler);
    const channel = echo.channels.get('user.15');

    expect(subscription.channel).toBe('user.15');
    expect(subscription.wireChannel).toBe('private-user.15');
    expect(channel).toBeInstanceOf(FakeEchoChannel);

    channel?.emit('.pixel.realtime.notification', {
      notification: {
        id: '1',
        user_id: '15',
        user_type: null,
        type: 'invoice.created',
        title: 'Invoice created',
        body: null,
        data: { invoice_id: 1001 },
        read_at: null,
        created_at: null,
      },
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        type: 'invoice.created',
      }),
    );

    subscription.stop();
    expect(channel?.stopped).toEqual(['.pixel.realtime.notification']);
    expect(echo.left).toEqual(['user.15']);
  });

  it('normalizes a custom notification event name to its wire form', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, userId: 15, notificationEvent: 'my.custom.event' });

    client.notifications.listen(vi.fn());

    // A leading dot is added so Echo matches the broadcastAs() name.
    expect(echo.channels.get('user.15')?.listeners.has('.my.custom.event')).toBe(true);
  });
});

describe('createNotificationsApi', () => {
  it('calls notification endpoints with configured headers', async () => {
    const calls: Array<{ url: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url, init });

      return new Response(
        JSON.stringify({
          data: url.toString().includes('unread-count') ? { count: 3 } : [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    const api = createNotificationsApi({
      baseUrl: '/rt',
      fetch: fetcher,
      tokenProvider: () => 'jwt-token',
      headers: { Authorization: 'Bearer token' },
    });

    await expect(api.list({ limit: 10 })).resolves.toEqual([]);
    await expect(api.unreadCount()).resolves.toBe(3);

    expect(calls[0]?.url).toBe('/rt/notifications?limit=10');
    expect(calls[0]?.init?.headers).toMatchObject({
      Accept: 'application/json',
      Authorization: 'Bearer token',
    });
    expect(calls[1]?.url).toBe('/rt/notifications/unread-count');
  });

  it('uses tokenProvider as a bearer token source', async () => {
    const calls: Array<{ url: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url, init });

      return new Response(JSON.stringify({ data: { count: 2 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const api = createNotificationsApi({
      fetch: fetcher,
      tokenProvider: async () => 'jwt-token',
    });

    await expect(api.unreadCount()).resolves.toBe(2);

    expect(calls[0]?.init?.headers).toMatchObject({
      Authorization: 'Bearer jwt-token',
    });
  });
});
