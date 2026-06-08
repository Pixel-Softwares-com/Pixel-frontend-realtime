import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { createReverbEchoConfig, type ReverbEchoConfigOptions } from './reverb';
import { createRealtimeClient, type RealtimeClient, type RealtimeClientOptions } from './client';
import type { EchoLike } from './types';

export type CreateRealtimeOptions = ReverbEchoConfigOptions & Omit<RealtimeClientOptions, 'echo'>;

/**
 * Batteries-included entry point: builds the Reverb config, constructs Echo (with
 * pusher-js wired in), and returns a ready RealtimeClient — so a consuming app does
 * not import laravel-echo/pusher-js, set `window.Pusher`, or call `new Echo` itself.
 *
 * For advanced cases that need to own the Echo instance, keep using
 * `createReverbEchoConfig` + `createRealtimeClient({ echo })` directly.
 */
export function createRealtime(options: CreateRealtimeOptions): RealtimeClient {
  const {
    key,
    host,
    port,
    scheme,
    authEndpoint,
    auth,
    tokenProvider,
    enabledTransports,
    ...clientOptions
  } = options;

  if (typeof window !== 'undefined') {
    (window as typeof window & { Pusher: typeof Pusher }).Pusher = Pusher;
  }

  const echo = new Echo({
    ...createReverbEchoConfig({ key, host, port, scheme, authEndpoint, auth, tokenProvider, enabledTransports }),
    Pusher,
  } as unknown as ConstructorParameters<typeof Echo>[0]) as unknown as EchoLike;

  return createRealtimeClient({ echo, ...clientOptions });
}
