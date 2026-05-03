# pixel-realtime contract

This document defines the current boundary between the backend and frontend packages.

## Backend package

- Composer package: `pixel/realtime`
- Namespace: `Pixel\Realtime`
- Laravel config key: `pixel-realtime`
- Publish tag: `pixel-realtime-config`
- Current provider: `Pixel\Realtime\RealtimeServiceProvider`

## Frontend package

- npm package: `pixel-realtime`
- Entry point: `src/index.ts`
- Current factory: `createRealtimeClient(options)`
- Reverb helper: `createReverbEchoConfig(options)`
- Auth token source: `tokenProvider`
- First module: Notifications

## Modules

Core is always installed. Modules are optional and publish only their own backend migrations.

- `notifications`: implemented in v1
- `custom_channels`: reserved
- `chat`: reserved
- `presence`: reserved

## Notifications data

- Echo channel name: `user.{id}`
- Wire/private channel name: `private-user.{id}`
- Event name: `.pixel.realtime.notification`
- API prefix: `/pixel-realtime`

## Auth boundary

The frontend package does not login users or store tokens. Applications pass a `tokenProvider` when they use JWT, Sanctum bearer tokens, Passport, or a custom token store. Session/cookie apps can omit it.
