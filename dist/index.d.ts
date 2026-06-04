type ChannelId = string | number;
type ChannelConfig = {
    userEchoPrefix: string;
    userWirePrefix: string;
};
type EchoPrivateChannel<TPayload = unknown> = {
    listen(event: string, callback: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
    stopListening?(event: string, callback?: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
};
type PresenceMember = {
    id: ChannelId;
    [key: string]: unknown;
};
type EchoPresenceChannel<TPayload = unknown> = {
    here(callback: (members: PresenceMember[]) => void): EchoPresenceChannel<TPayload>;
    joining(callback: (member: PresenceMember) => void): EchoPresenceChannel<TPayload>;
    leaving(callback: (member: PresenceMember) => void): EchoPresenceChannel<TPayload>;
    listen(event: string, callback: (payload: TPayload) => void): EchoPresenceChannel<TPayload>;
    stopListening?(event: string, callback?: (payload: TPayload) => void): EchoPresenceChannel<TPayload>;
    error?(callback: (error: unknown) => void): EchoPresenceChannel<TPayload>;
};
type EchoLike = {
    private(channel: string): EchoPrivateChannel;
    join?(channel: string): EchoPresenceChannel;
    leave?(channel: string): void;
    leaveChannel?(channel: string): void;
};
type RealtimeSubscription = {
    channel: string;
    wireChannel: string;
    stop(): void;
};

type AuthToken = string | null | undefined;
type TokenProvider = () => AuthToken | Promise<AuthToken>;
type SyncTokenProvider = () => AuthToken;
declare function createBearerHeaders(tokenProvider?: TokenProvider): Promise<Record<string, string>>;
declare function createSyncBearerHeaders(tokenProvider?: SyncTokenProvider): Record<string, string>;

type RealtimeNotificationData = Record<string, unknown>;
type RealtimeNotification = {
    id: string;
    user_id: string;
    user_type: string | null;
    type: string;
    title: string | null;
    body: string | null;
    data: RealtimeNotificationData;
    read_at: string | null;
    created_at: string | null;
};
type NotificationEventPayload = {
    notification: RealtimeNotification;
};

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type HeadersFactory = HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
type NotificationsApiOptions = {
    baseUrl?: string;
    fetch?: FetchLike;
    headers?: HeadersFactory;
    tokenProvider?: TokenProvider;
};
type NotificationsApi = {
    list(options?: {
        limit?: number;
    }): Promise<RealtimeNotification[]>;
    unreadCount(): Promise<number>;
    markAsRead(id: string): Promise<boolean>;
    markAllAsRead(): Promise<number>;
};
declare function createNotificationsApi(options?: NotificationsApiOptions): NotificationsApi;

type NotificationHandler = (notification: RealtimeNotification) => void;
type ListenForNotificationsOptions = {
    echo: EchoLike;
    userId: ChannelId;
    channels?: Partial<ChannelConfig>;
    event?: string;
    guard?: string;
    onNotification: NotificationHandler;
};
declare function listenForNotifications(options: ListenForNotificationsOptions): RealtimeSubscription;

type CustomChannelPayload = Record<string, unknown>;
type CustomChannelEnvelope<TPayload = CustomChannelPayload> = {
    channel: string;
    event: string;
    payload: TPayload;
};
type CustomChannelEventHandler<TPayload = CustomChannelPayload> = (payload: TPayload, envelope?: CustomChannelEnvelope<TPayload>) => void;
type CustomChannelOptions = {
    echo: EchoLike;
    type: string;
    id: ChannelId;
    prefix?: string;
};
type CustomChannelHandle = {
    channel: string;
    wireChannel: string;
    listen<TPayload = CustomChannelPayload>(event: string, handler: CustomChannelEventHandler<TPayload>): RealtimeSubscription;
    stop(): void;
};

type PresenceChannelPayload = Record<string, unknown>;
type PresenceChannelEnvelope<TPayload = PresenceChannelPayload> = {
    channel: string;
    event: string;
    payload: TPayload;
};
type PresenceChannelEventHandler<TPayload = PresenceChannelPayload> = (payload: TPayload, envelope?: PresenceChannelEnvelope<TPayload>) => void;
type PresenceMemberHandler = (member: PresenceMember) => void;
type PresenceMembersHandler = (members: PresenceMember[]) => void;
type PresenceChannelOptions = {
    echo: EchoLike;
    type: string;
    id: ChannelId;
    prefix?: string;
};
type PresenceChannelHandle = {
    channel: string;
    wireChannel: string;
    here(handler: PresenceMembersHandler): PresenceChannelHandle;
    joining(handler: PresenceMemberHandler): PresenceChannelHandle;
    leaving(handler: PresenceMemberHandler): PresenceChannelHandle;
    listen<TPayload = PresenceChannelPayload>(event: string, handler: PresenceChannelEventHandler<TPayload>): RealtimeSubscription;
    stop(): void;
};

type RealtimeClientOptions = {
    echo: EchoLike;
    userId?: ChannelId;
    channels?: Partial<ChannelConfig>;
    api?: NotificationsApiOptions;
    notificationEvent?: string;
    customChannelPrefix?: string;
    presenceChannelPrefix?: string;
    guard?: string;
};
type NotificationsClient = {
    api: NotificationsApi;
    listen(handler: NotificationHandler, userId?: ChannelId, guard?: string): ReturnType<typeof listenForNotifications>;
};
type RealtimeClient = {
    userChannel(userId?: ChannelId): string;
    privateUserChannel(userId?: ChannelId): string;
    notifications: NotificationsClient;
    channel(type: string, id: ChannelId): CustomChannelHandle;
    presence(type: string, id: ChannelId): PresenceChannelHandle;
};
declare function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient;

type ReverbTransport = 'ws' | 'wss';
type ReverbEchoConfigOptions = {
    key: string;
    host?: string;
    port?: number;
    scheme?: 'http' | 'https';
    authEndpoint?: string;
    auth?: {
        headers?: Record<string, string>;
    };
    tokenProvider?: SyncTokenProvider;
    enabledTransports?: ReverbTransport[];
};
type ReverbEchoConfig = {
    broadcaster: 'reverb';
    key: string;
    wsHost: string;
    wsPort: number;
    wssPort: number;
    forceTLS: boolean;
    enabledTransports: ReverbTransport[];
    authEndpoint: string;
    auth?: {
        headers?: Record<string, string>;
    };
};
declare function createReverbEchoConfig(options: ReverbEchoConfigOptions): ReverbEchoConfig;

declare const defaultChannelConfig: ChannelConfig;
declare function userChannel(id: ChannelId, config?: Partial<ChannelConfig>): string;
declare function privateUserChannel(id: ChannelId, config?: Partial<ChannelConfig>): string;
declare function scopedChannel(scope: string, id: ChannelId): string;
declare function privateScopedChannel(scope: string, id: ChannelId): string;

/**
 * Normalizes an event name to its Pusher/Echo "wire" form.
 *
 * Laravel broadcasts custom event names (via `broadcastAs`) without the
 * framework namespace, and Echo requires a leading `.` to listen for them.
 * This helper adds that dot if the caller did not, so both the notifications
 * and custom-channels listeners stay consistent.
 */
declare function toWireEvent(event: string): string;

type BenchmarkSample = {
    benchmark_id: string;
    sequence: number;
    sent_at_ms: number;
    received_at_ms: number;
    latency_ms: number;
};
type BenchmarkSummary = {
    received: number;
    expectedCount: number | null;
    lost: number | null;
    min: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    byBenchmark: Record<string, number>;
};
type BenchmarkRecorderOptions = {
    expectedCount?: number;
    now?: () => number;
};
type BenchmarkRecorder = {
    record: (notification: RealtimeNotification) => BenchmarkSample | null;
    samples: () => BenchmarkSample[];
    summary: () => BenchmarkSummary;
    reset: () => void;
};
declare function createBenchmarkRecorder(options?: BenchmarkRecorderOptions): BenchmarkRecorder;

declare function buildCustomChannelName(type: string, id: ChannelId, prefix?: string): string;
declare function buildPrivateWireName(channel: string): string;
declare function openCustomChannel(options: CustomChannelOptions): CustomChannelHandle;
declare function listenForCustomChannel<TPayload = CustomChannelPayload>(echo: EchoLike, type: string, id: ChannelId, event: string, handler: CustomChannelEventHandler<TPayload>, prefix?: string): RealtimeSubscription;

declare function buildPresenceChannelName(type: string, id: ChannelId, prefix?: string): string;
declare function buildPresenceWireName(channel: string): string;
declare function openPresenceChannel(options: PresenceChannelOptions): PresenceChannelHandle;
declare function listenForPresenceChannel<TPayload = PresenceChannelPayload>(echo: EchoLike, type: string, id: ChannelId, event: string, handler: PresenceChannelEventHandler<TPayload>, prefix?: string): RealtimeSubscription;

export { type AuthToken, type BenchmarkRecorder, type BenchmarkRecorderOptions, type BenchmarkSample, type BenchmarkSummary, type ChannelConfig, type ChannelId, type CustomChannelEnvelope, type CustomChannelEventHandler, type CustomChannelHandle, type CustomChannelOptions, type CustomChannelPayload, type EchoLike, type EchoPresenceChannel, type EchoPrivateChannel, type FetchLike, type HeadersFactory, type ListenForNotificationsOptions, type NotificationEventPayload, type NotificationHandler, type NotificationsApi, type NotificationsApiOptions, type NotificationsClient, type PresenceChannelEnvelope, type PresenceChannelEventHandler, type PresenceChannelHandle, type PresenceChannelOptions, type PresenceChannelPayload, type PresenceMember, type PresenceMemberHandler, type PresenceMembersHandler, type RealtimeClient, type RealtimeClientOptions, type RealtimeNotification, type RealtimeNotificationData, type RealtimeSubscription, type ReverbEchoConfig, type ReverbEchoConfigOptions, type ReverbTransport, type SyncTokenProvider, type TokenProvider, buildCustomChannelName, buildPresenceChannelName, buildPresenceWireName, buildPrivateWireName, createBearerHeaders, createBenchmarkRecorder, createNotificationsApi, createRealtimeClient, createReverbEchoConfig, createSyncBearerHeaders, defaultChannelConfig, listenForCustomChannel, listenForNotifications, listenForPresenceChannel, openCustomChannel, openPresenceChannel, privateScopedChannel, privateUserChannel, scopedChannel, toWireEvent, userChannel };
