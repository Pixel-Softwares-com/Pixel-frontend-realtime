import { userChannel, privateUserChannel } from './channel';
import type { ChannelConfig, ChannelId, EchoLike } from './types';
import { createNotificationsApi, type NotificationsApi, type NotificationsApiOptions } from '../modules/notifications/api';
import { listenForNotifications, type NotificationHandler } from '../modules/notifications/listener';
import type { RealtimeNotification } from '../modules/notifications/types';
import { openCustomChannel } from '../modules/custom-channels/listener';
import type { CustomChannelHandle } from '../modules/custom-channels/types';
import { openPresenceChannel } from '../modules/presence/listener';
import type { PresenceChannelHandle } from '../modules/presence/types';

export type RealtimeClientOptions = {
  echo: EchoLike;
  userId?: ChannelId;
  channels?: Partial<ChannelConfig>;
  api?: NotificationsApiOptions;
  notificationEvent?: string;
  customChannelPrefix?: string;
  presenceChannelPrefix?: string;
  guard?: string;
};

export type NotificationsClient = {
  api: NotificationsApi;
  listen(
    handler: NotificationHandler,
    userId?: ChannelId,
    guard?: string,
  ): ReturnType<typeof listenForNotifications>;
};

export type RealtimeClient = {
  userChannel(userId?: ChannelId): string;
  privateUserChannel(userId?: ChannelId): string;
  notifications: NotificationsClient;
  channel(type: string, id: ChannelId): CustomChannelHandle;
  presence(type: string, id: ChannelId): PresenceChannelHandle;
};

export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  const notificationsApi = createNotificationsApi(options.api ?? {});

  return {
    userChannel(userId?: ChannelId) {
      return userChannel(resolveUserId(userId, options.userId), options.channels);
    },

    privateUserChannel(userId?: ChannelId) {
      return privateUserChannel(resolveUserId(userId, options.userId), options.channels);
    },

    notifications: {
      api: notificationsApi,

      listen(handler: (notification: RealtimeNotification) => void, userId?: ChannelId, guard?: string) {
        const resolvedUserId = resolveUserId(userId, options.userId);

        return listenForNotifications({
          echo: options.echo,
          userId: resolvedUserId,
          channels: options.channels,
          event: options.notificationEvent,
          guard: guard ?? options.guard,
          onNotification: handler,
        });
      },
    },

    channel(type: string, id: ChannelId): CustomChannelHandle {
      return openCustomChannel({
        echo: options.echo,
        type,
        id,
        prefix: options.customChannelPrefix,
      });
    },

    presence(type: string, id: ChannelId): PresenceChannelHandle {
      return openPresenceChannel({
        echo: options.echo,
        type,
        id,
        prefix: options.presenceChannelPrefix,
      });
    },
  };
}

function resolveUserId(userId?: ChannelId, fallback?: ChannelId): ChannelId {
  const value = userId ?? fallback;

  if (value === undefined || String(value).trim() === '') {
    throw new Error('User id is required.');
  }

  return value;
}
