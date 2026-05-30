import { describe, expect, it, vi } from 'vitest';
import {
  buildCustomChannelName,
  buildPrivateWireName,
  createRealtimeClient,
  listenForCustomChannel,
  openCustomChannel,
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

describe('custom channel name helpers', () => {
  it('builds {type}.{id} channel names', () => {
    expect(buildCustomChannelName('orders', 15)).toBe('orders.15');
    expect(buildCustomChannelName('tickets', '8')).toBe('tickets.8');
  });

  it('supports an optional prefix', () => {
    expect(buildCustomChannelName('orders', 15, 'app')).toBe('app.orders.15');
  });

  it('builds private-prefixed wire names', () => {
    expect(buildPrivateWireName('orders.15')).toBe('private-orders.15');
  });

  it('rejects empty type or id', () => {
    expect(() => buildCustomChannelName('', 15)).toThrow();
    expect(() => buildCustomChannelName('orders', '')).toThrow();
  });
});

describe('openCustomChannel', () => {
  it('subscribes through Echo to a private channel', () => {
    const echo = new FakeEcho();
    const handle = openCustomChannel({ echo, type: 'orders', id: 15 });
    const handler = vi.fn();

    handle.listen('order.updated', handler);

    const channel = echo.channels.get('orders.15');
    expect(handle.channel).toBe('orders.15');
    expect(handle.wireChannel).toBe('private-orders.15');
    expect(channel?.listeners.has('.order.updated')).toBe(true);

    channel?.emit('.order.updated', {
      channel: 'orders.15',
      event: 'order.updated',
      payload: { status: 'paid' },
    });

    expect(handler).toHaveBeenCalledWith(
      { status: 'paid' },
      expect.objectContaining({ event: 'order.updated' }),
    );
  });

  it('passes raw payloads when no envelope wraps them', () => {
    const echo = new FakeEcho();
    const handle = openCustomChannel({ echo, type: 'tickets', id: 8 });
    const handler = vi.fn();

    handle.listen('ticket.created', handler);
    echo.channels.get('tickets.8')?.emit('.ticket.created', { id: 1 });

    expect(handler).toHaveBeenCalledWith({ id: 1 }, undefined);
  });

  it('stops every listener and leaves the channel on stop()', () => {
    const echo = new FakeEcho();
    const handle = openCustomChannel({ echo, type: 'orders', id: 15 });

    handle.listen('order.updated', () => undefined);
    handle.listen('order.deleted', () => undefined);

    handle.stop();

    const channel = echo.channels.get('orders.15');
    expect(channel?.stopped).toEqual(expect.arrayContaining(['.order.updated', '.order.deleted']));
    expect(echo.left).toEqual(['orders.15']);
  });
});

describe('listenForCustomChannel', () => {
  it('exposes a flat helper for one-shot listeners', () => {
    const echo = new FakeEcho();
    const handler = vi.fn();

    listenForCustomChannel(echo, 'orders', 15, 'order.updated', handler);

    echo.channels.get('orders.15')?.emit('.order.updated', {
      channel: 'orders.15',
      event: 'order.updated',
      payload: { id: 1 },
    });

    expect(handler).toHaveBeenCalledWith({ id: 1 }, expect.any(Object));
  });
});

describe('createRealtimeClient', () => {
  it('exposes channel(type, id) helper', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo });

    const handle = client.channel('orders', 15);

    expect(handle.channel).toBe('orders.15');
    expect(handle.wireChannel).toBe('private-orders.15');
    expect(echo.channels.has('orders.15')).toBe(true);
  });

  it('respects the configured custom channel prefix', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, customChannelPrefix: 'app' });

    const handle = client.channel('orders', 15);

    expect(handle.channel).toBe('app.orders.15');
    expect(handle.wireChannel).toBe('private-app.orders.15');
  });
});
