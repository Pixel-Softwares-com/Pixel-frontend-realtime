import { privateUserChannel, userChannel } from '../../core/channel';
import type { ChannelConfig, ChannelId, EchoLike, RealtimeSubscription } from '../../core/types';
import type { NotificationEventPayload, RealtimeNotification } from './types';

export type NotificationHandler = (notification: RealtimeNotification) => void;

export type ListenForNotificationsOptions = {
  echo: EchoLike;
  userId: ChannelId;
  channels?: Partial<ChannelConfig>;
  event?: string;
  onNotification: NotificationHandler;
};

export function listenForNotifications(options: ListenForNotificationsOptions): RealtimeSubscription {
  const channel = userChannel(options.userId, options.channels);
  const wireChannel = privateUserChannel(options.userId, options.channels);
  const event = options.event ?? '.pixel.realtime.notification';
  const echoChannel = options.echo.private(channel);
  const callback = (payload: unknown) => {
    options.onNotification(extractNotification(payload));
  };

  echoChannel.listen(event, callback);

  return {
    channel,
    wireChannel,
    stop() {
      echoChannel.stopListening?.(event, callback);
      options.echo.leave?.(channel);
      options.echo.leaveChannel?.(wireChannel);
    },
  };
}

function extractNotification(payload: unknown): RealtimeNotification {
  if (isNotificationPayload(payload)) {
    return payload.notification;
  }

  return payload as RealtimeNotification;
}

function isNotificationPayload(payload: unknown): payload is NotificationEventPayload {
  return typeof payload === 'object' && payload !== null && 'notification' in payload;
}
