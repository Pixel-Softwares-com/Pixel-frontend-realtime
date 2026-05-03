export type AuthToken = string | null | undefined;
export type TokenProvider = () => AuthToken | Promise<AuthToken>;
export type SyncTokenProvider = () => AuthToken;

export async function createBearerHeaders(tokenProvider?: TokenProvider): Promise<Record<string, string>> {
  return bearerHeader(normalizeToken(await tokenProvider?.()));
}

export function createSyncBearerHeaders(tokenProvider?: SyncTokenProvider): Record<string, string> {
  return bearerHeader(normalizeToken(tokenProvider?.()));
}

function bearerHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeToken(token: AuthToken): string | null {
  const value = token?.trim();
  return value ? value : null;
}
