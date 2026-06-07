import { describe, expect, it } from 'vitest';
import { createConnectionClient, createRealtimeClient, type EchoLike } from '../src/index';

class FakePusherConnection {
  state: string;
  handlers = new Set<() => void>();

  constructor(state = 'initialized') {
    this.state = state;
  }

  bind(event: string, handler: () => void): void {
    if (event === 'state_change') this.handlers.add(handler);
  }

  unbind(_event: string, handler: () => void): void {
    this.handlers.delete(handler);
  }

  set(state: string): void {
    this.state = state;
    this.handlers.forEach((handler) => handler());
  }
}

class FakePusher {
  connection: FakePusherConnection;
  connectCount = 0;
  disconnectCount = 0;

  constructor(connection: FakePusherConnection) {
    this.connection = connection;
  }

  connect(): void {
    this.connectCount += 1;
  }

  disconnect(): void {
    this.disconnectCount += 1;
  }
}

function makeEcho(state = 'initialized') {
  const connection = new FakePusherConnection(state);
  const pusher = new FakePusher(connection);
  const echo = { connector: { pusher } } as unknown as EchoLike;
  return { echo, connection, pusher };
}

describe('connection client', () => {
  it('maps pusher states to a coarse status', () => {
    const { echo, connection } = makeEcho('connected');
    const client = createConnectionClient(echo);

    expect(client.status()).toBe('online');
    connection.state = 'connecting';
    expect(client.status()).toBe('reconnecting');
    connection.state = 'unavailable';
    expect(client.status()).toBe('reconnecting');
    connection.state = 'failed';
    expect(client.status()).toBe('offline');
    connection.state = 'disconnected';
    expect(client.status()).toBe('offline');
  });

  it('emits the current status immediately, then on transitions; unsubscribe stops updates', () => {
    const { echo, connection } = makeEcho('connecting');
    const client = createConnectionClient(echo);
    const seen: string[] = [];

    const off = client.onChange((status) => seen.push(status));
    expect(seen).toEqual(['reconnecting']); // immediate emit

    connection.set('connected');
    connection.set('disconnected');
    off();
    connection.set('connected'); // ignored after unsubscribe

    expect(seen).toEqual(['reconnecting', 'online', 'offline']);
  });

  it('reconnect() bounces the underlying pusher connection', () => {
    const { echo, pusher } = makeEcho('connected');
    createConnectionClient(echo).reconnect();

    expect(pusher.disconnectCount).toBe(1);
    expect(pusher.connectCount).toBe(1);
  });

  it('degrades gracefully when there is no pusher transport', () => {
    const echo = {} as unknown as EchoLike;
    const client = createConnectionClient(echo);
    const seen: string[] = [];

    expect(client.status()).toBe('offline');
    const off = client.onChange((status) => seen.push(status));
    expect(seen).toEqual(['offline']);
    expect(off).toBeTypeOf('function');
    expect(() => client.reconnect()).not.toThrow();
  });

  it('is exposed on the realtime client', () => {
    const { echo } = makeEcho('connected');
    const client = createRealtimeClient({ echo, userId: 1 });

    expect(client.connection.status()).toBe('online');
  });
});
