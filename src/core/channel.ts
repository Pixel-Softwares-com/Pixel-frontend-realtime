import type { ChannelConfig, ChannelId } from './types';

export const defaultChannelConfig: ChannelConfig = {
  userEchoPrefix: 'user',
  userWirePrefix: 'private-user',
};

export function userChannel(id: ChannelId, config: Partial<ChannelConfig> = {}): string {
  return buildChannel(config.userEchoPrefix ?? defaultChannelConfig.userEchoPrefix, id);
}

export function privateUserChannel(id: ChannelId, config: Partial<ChannelConfig> = {}): string {
  return buildChannel(config.userWirePrefix ?? defaultChannelConfig.userWirePrefix, id);
}

export function scopedChannel(scope: string, id: ChannelId): string {
  const cleanScope = scope.trim();

  if (!cleanScope) {
    throw new Error('Channel scope is required.');
  }

  return buildChannel(cleanScope, id);
}

export function privateScopedChannel(scope: string, id: ChannelId): string {
  return `private-${scopedChannel(scope, id)}`;
}

function buildChannel(prefix: string, id: ChannelId): string {
  const value = String(id).trim();

  if (!value) {
    throw new Error('Channel id is required.');
  }

  return `${prefix}.${value}`;
}
