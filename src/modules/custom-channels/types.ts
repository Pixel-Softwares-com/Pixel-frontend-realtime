import type { ChannelId, EchoLike, EchoPrivateChannel, RealtimeSubscription } from '../../core/types';

export type CustomChannelPayload = Record<string, unknown>;

export type CustomChannelEnvelope<TPayload = CustomChannelPayload> = {
  channel: string;
  event: string;
  payload: TPayload;
};

export type CustomChannelEventHandler<TPayload = CustomChannelPayload> = (
  payload: TPayload,
  envelope?: CustomChannelEnvelope<TPayload>,
) => void;

export type CustomChannelOptions = {
  echo: EchoLike;
  type: string;
  id: ChannelId;
  prefix?: string;
};

export type CustomChannelHandle = {
  channel: string;
  wireChannel: string;
  listen<TPayload = CustomChannelPayload>(
    event: string,
    handler: CustomChannelEventHandler<TPayload>,
  ): RealtimeSubscription;
  stop(): void;
};

export type EchoPrivateChannelLike = EchoPrivateChannel;
