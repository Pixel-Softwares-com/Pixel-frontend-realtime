import { describe, expect, it, vi } from 'vitest';
import {
  createNotificationsApi,
  createRealtimeClient,
  createReverbEchoConfig,
  privateUserChannel,
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
