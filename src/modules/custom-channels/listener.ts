import type { ChannelId, EchoLike, RealtimeSubscription } from '../../core/types';
import { toWireEvent } from '../../core/wire';
import type {
  CustomChannelEnvelope,
  CustomChannelEventHandler,
  CustomChannelHandle,
  CustomChannelOptions,
  CustomChannelPayload,
} from './types';

export function buildCustomChannelName(type: string, id: ChannelId, prefix?: string): string {
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

export function buildPrivateWireName(channel: string): string {
  const value = channel.trim();

  if (!value) {
    throw new Error('Channel name is required.');
  }

  return `private-${value}`;
}

export function openCustomChannel(options: CustomChannelOptions): CustomChannelHandle {
  const channel = buildCustomChannelName(options.type, options.id, options.prefix);
  const wireChannel = buildPrivateWireName(channel);
  const echoChannel = options.echo.private(channel);

  const subscriptions: Array<() => void> = [];

  return {
    channel,
    wireChannel,
    listen<TPayload = CustomChannelPayload>(
      event: string,
      handler: CustomChannelEventHandler<TPayload>,
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
}

export function listenForCustomChannel<TPayload = CustomChannelPayload>(
  echo: EchoLike,
  type: string,
  id: ChannelId,
  event: string,
  handler: CustomChannelEventHandler<TPayload>,
  prefix?: string,
): RealtimeSubscription {
  return openCustomChannel({ echo, type, id, prefix }).listen<TPayload>(event, handler);
}

function isEnvelope<TPayload>(payload: unknown): payload is CustomChannelEnvelope<TPayload> {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'channel' in payload
    && 'event' in payload
    && 'payload' in payload
  );
}
