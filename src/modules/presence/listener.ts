import type { ChannelId, EchoLike, RealtimeSubscription } from '../../core/types';
import { toWireEvent } from '../../core/wire';
import type {
  PresenceChannelEnvelope,
  PresenceChannelEventHandler,
  PresenceChannelHandle,
  PresenceChannelOptions,
  PresenceChannelPayload,
  PresenceMemberHandler,
  PresenceMembersHandler,
} from './types';

export function buildPresenceChannelName(type: string, id: ChannelId, prefix?: string): string {
  const cleanType = type.trim();
  const cleanId = String(id).trim();

  if (!cleanType) {
    throw new Error('Channel type is required.');
  }

  if (!cleanId) {
    throw new Error('Channel id is required.');
  }

  const cleanPrefix = prefix?.trim().replace(/^\.+|\.+$/g, '') ?? '';
  const base = `${cleanType}.${cleanId}`;

  return cleanPrefix ? `${cleanPrefix}.${base}` : base;
}

export function buildPresenceWireName(channel: string): string {
  const value = channel.trim();

  if (!value) {
    throw new Error('Channel name is required.');
  }

  return `presence-${value}`;
}

export function openPresenceChannel(options: PresenceChannelOptions): PresenceChannelHandle {
  const channel = buildPresenceChannelName(options.type, options.id, options.prefix);
  const wireChannel = buildPresenceWireName(channel);

  if (typeof options.echo.join !== 'function') {
    throw new Error(
      'The provided Echo instance does not support presence channels (missing join()).',
    );
  }

  const echoChannel = options.echo.join(channel);
  const subscriptions: Array<() => void> = [];

  const handle: PresenceChannelHandle = {
    channel,
    wireChannel,
    here(handler: PresenceMembersHandler): PresenceChannelHandle {
      echoChannel.here(handler);
      return handle;
    },
    joining(handler: PresenceMemberHandler): PresenceChannelHandle {
      echoChannel.joining(handler);
      return handle;
    },
    leaving(handler: PresenceMemberHandler): PresenceChannelHandle {
      echoChannel.leaving(handler);
      return handle;
    },
    listen<TPayload = PresenceChannelPayload>(
      event: string,
      handler: PresenceChannelEventHandler<TPayload>,
    ): RealtimeSubscription {
      const wireEvent = toWireEvent(event);
      const callback = (payload: unknown) => {
        const envelope = isEnvelope<TPayload>(payload) ? payload : undefined;
        const data = envelope ? envelope.payload : (payload as TPayload);
        handler(data, envelope);
      };

      echoChannel.listen(wireEvent, callback);

      const stop = () => {
        echoChannel.stopListening?.(wireEvent, callback);
      };

      subscriptions.push(stop);

      return {
        channel,
        wireChannel,
        stop,
      };
    },
    stop() {
      while (subscriptions.length > 0) {
        const stop = subscriptions.pop();
        stop?.();
      }
      options.echo.leave?.(channel);
      options.echo.leaveChannel?.(wireChannel);
    },
  };

  return handle;
}

export function listenForPresenceChannel<TPayload = PresenceChannelPayload>(
  echo: EchoLike,
  type: string,
  id: ChannelId,
  event: string,
  handler: PresenceChannelEventHandler<TPayload>,
  prefix?: string,
): RealtimeSubscription {
  return openPresenceChannel({ echo, type, id, prefix }).listen<TPayload>(event, handler);
}

function isEnvelope<TPayload>(payload: unknown): payload is PresenceChannelEnvelope<TPayload> {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'channel' in payload
    && 'event' in payload
    && 'payload' in payload
  );
}
