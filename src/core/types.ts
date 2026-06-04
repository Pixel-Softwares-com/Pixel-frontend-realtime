export type ChannelId = string | number;

export type ChannelConfig = {
  userEchoPrefix: string;
  userWirePrefix: string;
};

export type EchoPrivateChannel<TPayload = unknown> = {
  listen(event: string, callback: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
  stopListening?(event: string, callback?: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
};

export type PresenceMember = {
  id: ChannelId;
  [key: string]: unknown;
};

export type EchoPresenceChannel<TPayload = unknown> = {
  here(callback: (members: PresenceMember[]) => void): EchoPresenceChannel<TPayload>;
  joining(callback: (member: PresenceMember) => void): EchoPresenceChannel<TPayload>;
  leaving(callback: (member: PresenceMember) => void): EchoPresenceChannel<TPayload>;
  listen(event: string, callback: (payload: TPayload) => void): EchoPresenceChannel<TPayload>;
  stopListening?(event: string, callback?: (payload: TPayload) => void): EchoPresenceChannel<TPayload>;
  error?(callback: (error: unknown) => void): EchoPresenceChannel<TPayload>;
};

export type EchoLike = {
  private(channel: string): EchoPrivateChannel;
  join?(channel: string): EchoPresenceChannel;
  leave?(channel: string): void;
  leaveChannel?(channel: string): void;
};

export type RealtimeSubscription = {
  channel: string;
  wireChannel: string;
  stop(): void;
};
