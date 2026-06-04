import { describe, expect, it, vi } from 'vitest';
import {
  buildPresenceChannelName,
  buildPresenceWireName,
  createRealtimeClient,
  listenForPresenceChannel,
  openPresenceChannel,
  type EchoLike,
  type EchoPresenceChannel,
  type PresenceMember,
} from '../src/index';

class FakePresenceChannel {
  listeners = new Map<string, (payload: unknown) => void>();
  stopped: string[] = [];
  hereHandlers: Array<(members: PresenceMember[]) => void> = [];
  joiningHandlers: Array<(member: PresenceMember) => void> = [];
  leavingHandlers: Array<(member: PresenceMember) => void> = [];

  here(callback: (members: PresenceMember[]) => void): FakePresenceChannel {
    this.hereHandlers.push(callback);
    return this;
  }

  joining(callback: (member: PresenceMember) => void): FakePresenceChannel {
    this.joiningHandlers.push(callback);
    return this;
  }

  leaving(callback: (member: PresenceMember) => void): FakePresenceChannel {
    this.leavingHandlers.push(callback);
    return this;
  }

  listen(event: string, callback: (payload: unknown) => void): FakePresenceChannel {
    this.listeners.set(event, callback);
    return this;
  }

  stopListening(event: string): FakePresenceChannel {
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
  privateChannels = new Map<string, never>();
  joined = new Map<string, FakePresenceChannel>();
  left: string[] = [];

  private(_channel: string): never {
    throw new Error('private() should not be used by presence channels.');
  }

  join(channel: string): EchoPresenceChannel {
    const existing = this.joined.get(channel);

    if (existing) {
      return existing as unknown as EchoPresenceChannel;
    }

    const created = new FakePresenceChannel();
    this.joined.set(channel, created);
    return created as unknown as EchoPresenceChannel;
  }

  leave(channel: string): void {
    this.left.push(channel);
  }
}

describe('presence channel name helpers', () => {
  it('builds {type}.{id} channel names', () => {
    expect(buildPresenceChannelName('report', 5)).toBe('report.5');
    expect(buildPresenceChannelName('report', '42')).toBe('report.42');
  });

  it('supports an optional prefix', () => {
    expect(buildPresenceChannelName('report', 5, 'rt')).toBe('rt.report.5');
  });

  it('builds presence-prefixed wire names', () => {
    expect(buildPresenceWireName('report.5')).toBe('presence-report.5');
  });

  it('rejects empty type or id', () => {
    expect(() => buildPresenceChannelName('', 5)).toThrow();
    expect(() => buildPresenceChannelName('report', '')).toThrow();
  });
});

describe('openPresenceChannel', () => {
  it('subscribes through Echo.join() and exposes channel names', () => {
    const echo = new FakeEcho();
    const handle = openPresenceChannel({ echo, type: 'report', id: 5 });

    expect(handle.channel).toBe('report.5');
    expect(handle.wireChannel).toBe('presence-report.5');
    expect(echo.joined.has('report.5')).toBe(true);
  });

  it('wires here / joining / leaving member handlers', () => {
    const echo = new FakeEcho();
    const handle = openPresenceChannel({ echo, type: 'report', id: 5 });
    const here = vi.fn();
    const joining = vi.fn();
    const leaving = vi.fn();

    handle.here(here).joining(joining).leaving(leaving);

    const channel = echo.joined.get('report.5');
    channel?.hereHandlers[0]?.([{ id: 1 }, { id: 2 }]);
    channel?.joiningHandlers[0]?.({ id: 3 });
    channel?.leavingHandlers[0]?.({ id: 1 });

    expect(here).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    expect(joining).toHaveBeenCalledWith({ id: 3 });
    expect(leaving).toHaveBeenCalledWith({ id: 1 });
  });

  it('unwraps the {channel,event,payload} envelope on listen', () => {
    const echo = new FakeEcho();
    const handle = openPresenceChannel({ echo, type: 'report', id: 5 });
    const handler = vi.fn();

    handle.listen('field.updated', handler);

    const channel = echo.joined.get('report.5');
    expect(channel?.listeners.has('.field.updated')).toBe(true);

    channel?.emit('.field.updated', {
      channel: 'report.5',
      event: 'field.updated',
      payload: { field: 'title', value: 'Hi' },
    });

    expect(handler).toHaveBeenCalledWith(
      { field: 'title', value: 'Hi' },
      expect.objectContaining({ event: 'field.updated' }),
    );
  });

  it('passes raw payloads when no envelope wraps them', () => {
    const echo = new FakeEcho();
    const handle = openPresenceChannel({ echo, type: 'report', id: 5 });
    const handler = vi.fn();

    handle.listen('field.locked', handler);
    echo.joined.get('report.5')?.emit('.field.locked', { field: 'title' });

    expect(handler).toHaveBeenCalledWith({ field: 'title' }, undefined);
  });

  it('stops every listener and leaves the channel on stop()', () => {
    const echo = new FakeEcho();
    const handle = openPresenceChannel({ echo, type: 'report', id: 5 });

    handle.listen('field.updated', () => undefined);
    handle.listen('field.locked', () => undefined);

    handle.stop();

    const channel = echo.joined.get('report.5');
    expect(channel?.stopped).toEqual(
      expect.arrayContaining(['.field.updated', '.field.locked']),
    );
    expect(echo.left).toEqual(['report.5']);
  });

  it('throws when the Echo instance cannot join presence channels', () => {
    const echo = { private: () => ({ listen: () => undefined }) } as unknown as EchoLike;

    expect(() => openPresenceChannel({ echo, type: 'report', id: 5 })).toThrow(/presence/i);
  });
});

describe('listenForPresenceChannel', () => {
  it('exposes a flat helper for one-shot listeners', () => {
    const echo = new FakeEcho();
    const handler = vi.fn();

    listenForPresenceChannel(echo, 'report', 5, 'field.updated', handler);

    echo.joined.get('report.5')?.emit('.field.updated', {
      channel: 'report.5',
      event: 'field.updated',
      payload: { field: 'title' },
    });

    expect(handler).toHaveBeenCalledWith({ field: 'title' }, expect.any(Object));
  });
});

describe('createRealtimeClient presence()', () => {
  it('exposes presence(type, id) helper', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo });

    const handle = client.presence('report', 5);

    expect(handle.channel).toBe('report.5');
    expect(handle.wireChannel).toBe('presence-report.5');
    expect(echo.joined.has('report.5')).toBe(true);
  });

  it('respects the configured presence channel prefix', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, presenceChannelPrefix: 'rt' });

    const handle = client.presence('report', 5);

    expect(handle.channel).toBe('rt.report.5');
    expect(handle.wireChannel).toBe('presence-rt.report.5');
  });
});
