import { createSyncBearerHeaders, type SyncTokenProvider } from './auth';

export type ReverbTransport = 'ws' | 'wss';

export type ReverbEchoConfigOptions = {
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

export type ReverbEchoConfig = {
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
    /** Called by pusher-js on every channel-auth request, so the token is never stale. */
    headersProvider?: () => Record<string, string>;
  };
};

export function createReverbEchoConfig(options: ReverbEchoConfigOptions): ReverbEchoConfig {
  const key = options.key.trim();

  if (!key) {
    throw new Error('Reverb app key is required.');
  }

  const forceTLS = options.scheme === 'https';
  const port = options.port ?? (forceTLS ? 443 : 8080);
  const callerHeaders = options.auth?.headers ?? {};

  // The token is resolved per auth request, not once at construction: a token read
  // at startup goes stale on the next login or refresh, and pusher-js would keep
  // sending that dead bearer on every subscribe — a silent 401 that leaves the
  // client connected but subscribed to nothing.
  const resolveAuthHeaders = () => ({
    ...createSyncBearerHeaders(options.tokenProvider),
    ...callerHeaders,
  });
  const authHeaders = resolveAuthHeaders();

  return {
    broadcaster: 'reverb',
    key,
    wsHost: options.host ?? windowSafeHost(),
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: options.enabledTransports ?? (forceTLS ? ['wss'] : ['ws', 'wss']),
    authEndpoint: options.authEndpoint ?? '/broadcasting/auth',
    auth: options.tokenProvider
      ? { headers: authHeaders, headersProvider: resolveAuthHeaders }
      : Object.keys(authHeaders).length > 0
        ? { headers: authHeaders }
        : options.auth,
  };
}

function windowSafeHost(): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  return '127.0.0.1';
}
