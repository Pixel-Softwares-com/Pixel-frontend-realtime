export { createRealtime } from './core/connect';
export type { CreateRealtimeOptions } from './core/connect';

export { createRealtimeClient } from './core/client';
export type { RealtimeClient, RealtimeClientOptions, NotificationsClient } from './core/client';

export { createConnectionClient } from './core/connection';
export type { ConnectionClient, ConnectionStatus } from './core/connection';

export { createReverbEchoConfig } from './core/reverb';
export type { ReverbEchoConfig, ReverbEchoConfigOptions, ReverbTransport } from './core/reverb';

export {
  userChannel,
  privateUserChannel,
  scopedChannel,
  privateScopedChannel,
  defaultChannelConfig,
} from './core/channel';

export { createBearerHeaders, createSyncBearerHeaders } from './core/auth';
export type { AuthToken, TokenProvider, SyncTokenProvider } from './core/auth';

export { toWireEvent } from './core/wire';

export type {
  ChannelId,
  ChannelConfig,
  EchoLike,
  EchoPrivateChannel,
  EchoPresenceChannel,
  PresenceMember,
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

export { createBenchmarkRecorder } from './modules/notifications/benchmark';
export type {
  BenchmarkRecorder,
  BenchmarkRecorderOptions,
  BenchmarkSample,
  BenchmarkSummary,
} from './modules/notifications/benchmark';

export {
  buildCustomChannelName,
  buildPrivateWireName,
  openCustomChannel,
  listenForCustomChannel,
} from './modules/custom-channels/listener';

export type {
  CustomChannelOptions,
  CustomChannelHandle,
  CustomChannelEventHandler,
  CustomChannelEnvelope,
  CustomChannelPayload,
} from './modules/custom-channels/types';

export {
  buildPresenceChannelName,
  buildPresenceWireName,
  openPresenceChannel,
  listenForPresenceChannel,
} from './modules/presence/listener';

export type {
  PresenceChannelOptions,
  PresenceChannelHandle,
  PresenceChannelEventHandler,
  PresenceChannelEnvelope,
  PresenceChannelPayload,
  PresenceMemberHandler,
  PresenceMembersHandler,
} from './modules/presence/types';
