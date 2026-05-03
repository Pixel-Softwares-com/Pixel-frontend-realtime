export { createRealtimeClient } from './core/client';
export type { RealtimeClient, RealtimeClientOptions, NotificationsClient } from './core/client';

export { createReverbEchoConfig } from './core/reverb';
export type { ReverbEchoConfig, ReverbEchoConfigOptions, ReverbTransport } from './core/reverb';

export { userChannel, privateUserChannel, defaultChannelConfig } from './core/channel';

export { createBearerHeaders, createSyncBearerHeaders } from './core/auth';
export type { AuthToken, TokenProvider, SyncTokenProvider } from './core/auth';

export type {
  ChannelId,
  ChannelConfig,
  EchoLike,
  EchoPrivateChannel,
  RealtimeSubscription,
} from './core/types';

export { createNotificationsApi } from './modules/notifications/api';
export type {
  NotificationsApi,
  NotificationsApiOptions,
  FetchLike,
  HeadersFactory,
} from './modules/notifications/api';

export { listenForNotifications } from './modules/notifications/listener';
export type { NotificationHandler, ListenForNotificationsOptions } from './modules/notifications/listener';

export type {
  RealtimeNotification,
  RealtimeNotificationData,
  NotificationEventPayload,
} from './modules/notifications/types';
