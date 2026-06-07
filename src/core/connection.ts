import type { EchoLike } from './types';

/** Coarse connection status surfaced to consumers. */
export type ConnectionStatus = 'online' | 'reconnecting' | 'offline';

export type ConnectionClient = {
  /** Current connection status. */
  status(): ConnectionStatus;
  /**
   * Subscribe to status changes. The handler is invoked immediately with the
   * current status, then on every transition. Returns an unsubscribe function.
   */
  onChange(handler: (status: ConnectionStatus) => void): () => void;
  /** Force an immediate reconnect attempt (the transport already auto-reconnects). */
  reconnect(): void;
};

type PusherConnectionLike = {
  state?: string;
  bind(event: string, handler: () => void): void;
  unbind(event: string, handler: () => void): void;
};

type PusherLike = {
  connection: PusherConnectionLike;
  connect(): void;
  disconnect(): void;
};

const NOOP = () => {};

/** Map raw pusher-js connection states to our coarse status. */
const mapState = (state: string | undefined): ConnectionStatus => {
  if (state === 'connected') return 'online';
  if (state === 'failed' || state === 'disconnected') return 'offline';
  return 'reconnecting'; // initialized | connecting | unavailable
};

/** Reach the underlying pusher-js instance behind an Echo, if present. */
const getPusher = (echo: EchoLike): PusherLike | undefined =>
  (echo as unknown as { connector?: { pusher?: PusherLike } })?.connector?.pusher;

/**
 * Connection-state helpers over an Echo instance built on the pusher protocol
 * (Reverb / Pusher). Resilient to non-pusher transports: status() reports
 * 'offline' and onChange()/reconnect() degrade gracefully.
 */
export function createConnectionClient(echo: EchoLike): ConnectionClient {
  return {
    status() {
      const pusher = getPusher(echo);
      return pusher ? mapState(pusher.connection?.state) : 'offline';
    },

    onChange(handler) {
      const pusher = getPusher(echo);
      if (!pusher?.connection?.bind) {
        handler(pusher ? mapState(pusher.connection?.state) : 'offline');
        return NOOP;
      }
      const { connection } = pusher;
      const listener = () => handler(mapState(connection.state));
      connection.bind('state_change', listener);
      handler(mapState(connection.state)); // emit current immediately
      return () => connection.unbind('state_change', listener);
    },

    reconnect() {
      const pusher = getPusher(echo);
      if (!pusher) return;
      pusher.disconnect();
      pusher.connect();
    },
  };
}
