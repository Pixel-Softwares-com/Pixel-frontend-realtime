import type {
  ChannelId,
  EchoLike,
  EchoPresenceChannel,
  PresenceMember,
  RealtimeSubscription,
} from '../../core/types';

export type PresenceChannelPayload = Record<string, unknown>;

export type PresenceChannelEnvelope<TPayload = PresenceChannelPayload> = {
  channel: string;
  event: string;
  payload: TPayload;
};

export type PresenceChannelEventHandler<TPayload = PresenceChannelPayload> = (
  payload: TPayload,
  envelope?: PresenceChannelEnvelope<TPayload>,
) => void;

export type PresenceMemberHandler = (member: PresenceMember) => void;

export type PresenceMembersHandler = (members: PresenceMember[]) => void;

export type PresenceChannelOptions = {
  echo: EchoLike;
  type: string;
  id: ChannelId;
  prefix?: string;
};

export type PresenceChannelHandle = {
  channel: string;
  wireChannel: string;
  here(handler: PresenceMembersHandler): PresenceChannelHandle;
  joining(handler: PresenceMemberHandler): PresenceChannelHandle;
  leaving(handler: PresenceMemberHandler): PresenceChannelHandle;
  listen<TPayload = PresenceChannelPayload>(
    event: string,
    handler: PresenceChannelEventHandler<TPayload>,
  ): RealtimeSubscription;
  stop(): void;
};

export type EchoPresenceChannelLike = EchoPresenceChannel;
