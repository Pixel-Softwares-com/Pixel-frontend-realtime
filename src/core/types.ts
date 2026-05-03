export type ChannelId = string | number;

export type ChannelConfig = {
  userEchoPrefix: string;
  userWirePrefix: string;
};

export type EchoPrivateChannel<TPayload = unknown> = {
  listen(event: string, callback: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
  stopListening?(event: string, callback?: (payload: TPayload) => void): EchoPrivateChannel<TPayload>;
};

export type EchoLike = {
  private(channel: string): EchoPrivateChannel;
  leave?(channel: string): void;
  leaveChannel?(channel: string): void;
};

export type RealtimeSubscription = {
  channel: string;
  wireChannel: string;
  stop(): void;
};
