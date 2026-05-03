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

function buildChannel(prefix: string, id: ChannelId): string {
  const value = String(id).trim();

  if (!value) {
    throw new Error('Channel id is required.');
  }

  return `${prefix}.${value}`;
}
