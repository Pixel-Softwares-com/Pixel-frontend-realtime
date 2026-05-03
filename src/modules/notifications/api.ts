import { createBearerHeaders, type TokenProvider } from '../../core/auth';
import type { RealtimeNotification } from './types';

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type HeadersFactory = HeadersInit | (() => HeadersInit | Promise<HeadersInit>);

export type NotificationsApiOptions = {
  baseUrl?: string;
  fetch?: FetchLike;
  headers?: HeadersFactory;
  tokenProvider?: TokenProvider;
};

export type NotificationsApi = {
  list(options?: { limit?: number }): Promise<RealtimeNotification[]>;
  unreadCount(): Promise<number>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(): Promise<number>;
};

export function createNotificationsApi(options: NotificationsApiOptions = {}): NotificationsApi {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? '/pixel-realtime');

  return {
    async list(listOptions = {}) {
      const search = new URLSearchParams();

      if (listOptions.limit !== undefined) {
        search.set('limit', String(listOptions.limit));
      }

      const query = search.toString();
      return request<RealtimeNotification[]>(`${baseUrl}/notifications${query ? `?${query}` : ''}`, options);
    },

    async unreadCount() {
      const response = await request<{ count: number }>(`${baseUrl}/notifications/unread-count`, options);
      return response.count;
    },

    async markAsRead(id: string) {
      const response = await request<{ updated: boolean }>(
        `${baseUrl}/notifications/${encodeURIComponent(id)}/read`,
        options,
        { method: 'POST' },
      );

      return response.updated;
    },

    async markAllAsRead() {
      const response = await request<{ updated: number }>(
        `${baseUrl}/notifications/read-all`,
        options,
        { method: 'POST' },
      );

      return response.updated;
    },
  };
}

async function request<T>(url: string, options: NotificationsApiOptions, init: RequestInit = {}): Promise<T> {
  const fetcher = options.fetch ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error('Fetch is not available in this environment.');
  }

  const response = await fetcher(url, {
    ...init,
    headers: await resolveHeaders(options.headers, init.headers, options.tokenProvider),
  });

  if (!response.ok) {
    throw new Error(`Pixel Realtime request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

async function resolveHeaders(
  headers?: HeadersFactory,
  requestHeaders?: HeadersInit,
  tokenProvider?: TokenProvider,
): Promise<HeadersInit> {
  const baseHeaders = typeof headers === 'function' ? await headers() : headers;

  return {
    Accept: 'application/json',
    ...(await createBearerHeaders(tokenProvider)),
    ...(baseHeaders ?? {}),
    ...(requestHeaders ?? {}),
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
