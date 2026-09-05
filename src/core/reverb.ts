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
    params?: Record<string, string>;
    paramsProvider?: () => Record<string, string>;
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
    /** Extra body fields on every channel-auth request. */
    params?: Record<string, string>;
    /** Called by pusher-js on every channel-auth request, so the fields are never stale. */
    paramsProvider?: () => Record<string, string>;
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

  // The auth endpoint often needs more than the token — a tenant, a role the caller is
  // acting as — and pusher-js already appends `params`/`paramsProvider` to the auth body.
  // Provider form for anything that changes while the client is alive.
  const authOptions: ReverbEchoConfig['auth'] = {};

  if (options.tokenProvider) {
    authOptions.headers = authHeaders;
    authOptions.headersProvider = resolveAuthHeaders;
  } else if (Object.keys(authHeaders).length > 0) {
    authOptions.headers = authHeaders;
  }

  if (options.auth?.params) {
    authOptions.params = options.auth.params;
  }

  if (options.auth?.paramsProvider) {
    authOptions.paramsProvider = options.auth.paramsProvider;
  }

  return {
    broadcaster: 'reverb',
    key,
    wsHost: options.host ?? windowSafeHost(),
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: options.enabledTransports ?? (forceTLS ? ['wss'] : ['ws', 'wss']),
    authEndpoint: options.authEndpoint ?? '/broadcasting/auth',
    auth: Object.keys(authOptions).length > 0 ? authOptions : options.auth,
  };
}

function windowSafeHost(): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  return '127.0.0.1';
}
