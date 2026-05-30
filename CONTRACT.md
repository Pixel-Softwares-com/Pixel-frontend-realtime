# pixel-realtime contract

The backend/frontend boundary is defined in a single canonical document:

➡️ [../docs/contract.md](../docs/contract.md)

That file covers package names, Reverb env keys, the auth boundary, modules,
and the notifications/custom-channels wire data. Update it first, then keep this
package in sync with it.

## Frontend essentials

- npm package: `pixel-realtime`
- Entry point: `src/index.ts`
- Main factory: `createRealtimeClient(options)`
- Reverb helper: `createReverbEchoConfig(options)` — accepts `key`, `host`,
  `port`, `scheme`, `authEndpoint`, `tokenProvider`. Never accepts or returns
  the Reverb app secret.
- Auth token source: `tokenProvider`. The package never logs users in or stores
  tokens; session/cookie apps can omit it.
