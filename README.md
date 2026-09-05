# pixel-realtime frontend

TypeScript helpers around Laravel Echo and Reverb. The package does not replace Echo; it gives the app a small, typed structure for Pixel Realtime modules.

> New here? Start with the [architecture overview](../docs/architecture.md) and the canonical [contract](../docs/contract.md).

## Install from GitHub

```bash
npm install github:Pixel-Softwares-com/Pixel-frontend-realtime#main
```

## Reverb Echo config

The frontend configures itself directly. There is no backend endpoint that returns realtime config — the package never exposes the Reverb app secret. **The package itself reads no environment variables** — your bundler reads them, and you pass the plain values to `createReverbEchoConfig`. So it works the same under any bundler; only the variable prefix differs.

**Create React App (CRA) / webpack** — variables must be prefixed `REACT_APP_` and are read from `process.env`:

```env
REACT_APP_PIXEL_REALTIME_APP_KEY=
REACT_APP_PIXEL_REALTIME_HOST=127.0.0.1
REACT_APP_PIXEL_REALTIME_PORT=8080
REACT_APP_PIXEL_REALTIME_SCHEME=http
```

**Vite** — variables must be prefixed `VITE_` and are read from `import.meta.env`:

```env
VITE_PIXEL_REALTIME_APP_KEY=
VITE_PIXEL_REALTIME_HOST=127.0.0.1
VITE_PIXEL_REALTIME_PORT=8080
VITE_PIXEL_REALTIME_SCHEME=http
```

`*_APP_KEY` is the public Reverb / Pusher app key, **not** the Laravel `APP_KEY`. The matching `PIXEL_REALTIME_APP_SECRET` lives on the backend only — never ship it to the browser.

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { createReverbEchoConfig } from 'pixel-realtime';

// laravel-echo's reverb broadcaster needs Pusher on the global object:
window.Pusher = Pusher;

// CRA / webpack — read from process.env.REACT_APP_*
// (Vite users read import.meta.env.VITE_* instead; the package takes the plain values either way)
const echo = new Echo({
  ...createReverbEchoConfig({
    key: process.env.REACT_APP_PIXEL_REALTIME_APP_KEY,
    host: process.env.REACT_APP_PIXEL_REALTIME_HOST,
    port: Number(process.env.REACT_APP_PIXEL_REALTIME_PORT ?? 8080),
    scheme: process.env.REACT_APP_PIXEL_REALTIME_SCHEME === 'https' ? 'https' : 'http',
    authEndpoint: '/broadcasting/auth',
    tokenProvider: () => localStorage.getItem('token'),
  }),
  Pusher,
});
```

The factory accepts `key`, `host`, `port`, `scheme`, `authEndpoint`, `tokenProvider`, and `auth`. It does not accept (or emit) a secret.

`auth` carries extra material to `/broadcasting/auth`: `headers` / `params` for fixed values, and `paramsProvider` for anything that changes while the client is alive — pusher-js calls it on every channel-auth request, so the value is never a stale snapshot.

```ts
createReverbEchoConfig({
  key: process.env.REACT_APP_PIXEL_REALTIME_APP_KEY,
  tokenProvider: () => localStorage.getItem('token'),
  // reaches the auth endpoint as a normal request field on every subscribe
  auth: { paramsProvider: () => ({ view_as: readCurrentRole() }) },
});
```
 The real user check happens at `/broadcasting/auth` using your session / Sanctum / JWT — `APP_KEY` is not a substitute for user authentication.

> `pixel-realtime` is a thin layer **around** Echo — it does not bundle it. Install the two peer libraries in your app: `npm install laravel-echo pusher-js`. (`pusher-js` is just the Pusher *protocol* client that Reverb speaks; it does not mean you use the hosted Pusher service.)

## Notifications

```ts
import { createRealtimeClient } from 'pixel-realtime';

const realtime = createRealtimeClient({
  echo,
  userId: currentUser.id,
  api: {
    baseUrl: '/pixel-realtime',
    tokenProvider: () => token,
  },
});

realtime.notifications.listen((notification) => {
  console.log(notification.type, notification.data);
});

const unread = await realtime.notifications.api.unreadCount();
```

## Custom Channels

Per-resource private channels with the same Echo / token setup:

```ts
const handle = realtime.channel('orders', 15);

const subscription = handle.listen<{ status: string }>('order.updated', (payload, envelope) => {
  console.log(payload.status, envelope?.event);
});

// Stop one event:
subscription.stop();

// Or stop the whole channel:
handle.stop();
```

The frontend listens only — any action that should fire an event must hit a normal HTTP route in your application; the backend dispatches via `CustomChannelManager`. Backend setup, authorization override, and table layout are documented in [docs/custom-channels.md](../docs/custom-channels.md).

> **Backend prerequisite:** install the module and run migrations:
> ```bash
> php artisan pixel-realtime:install --module=custom_channels
> php artisan migrate
> # If your project pins migration paths explicitly:
> php artisan migrate --path=database/migrations/realtime
> ```

## Presence Channels

Per-resource **presence** channels — the live roster of who is currently on a resource, plus join/leave events as connections open and drop. Built on `Echo.join()`, so Reverb signals `leaving` automatically when a socket disconnects (no polling). Useful for "who is viewing this report", collaborative editing, and releasing per-field locks the moment an editor disconnects.

```ts
const handle = realtime.presence('report', 5);

handle
  .here((members) => console.log('currently here:', members))
  .joining((member) => console.log('joined:', member.id))
  .leaving((member) => console.log('left:', member.id));

// Presence channels also carry server-dispatched events (same envelope as custom channels):
const subscription = handle.listen<{ field: string; value: unknown }>('field.updated', (payload) => {
  console.log(payload.field, payload.value);
});

// Stop one event:
subscription.stop();

// Or leave the presence channel entirely:
handle.stop();
```

The echo channel is `report.5`; the wire channel is `presence-report.5`. Like custom channels, the frontend **listens only** — the backend dispatches via `PresenceChannelManager` and authorizes joins with a presence authorizer that also returns each member's public info. Backend setup is documented in [docs/presence.md](../docs/presence.md).

You can also import the helpers directly: `openPresenceChannel`, `listenForPresenceChannel`, `buildPresenceChannelName`, `buildPresenceWireName`.

## Connection Status

A small read-only view of the live socket, for showing an "offline / reconnecting" indicator and offering a manual reconnect. Exposed on the realtime client as `connection`:

```ts
const realtime = createRealtime({ /* ...reverb config... */ });

// current coarse status: 'online' | 'reconnecting' | 'offline'
realtime.connection.status();

// subscribe — fires immediately with the current status, then on every change.
// returns an unsubscribe function.
const off = realtime.connection.onChange((status) => {
  console.log('socket is', status);
});

// force an immediate reconnect attempt (the transport already auto-reconnects)
realtime.connection.reconnect();

off();
```

Status is derived from the underlying pusher-js connection state: `connected → online`; `failed`/`disconnected → offline`; everything else (`connecting`, `unavailable`, …) → `reconnecting`. On a non-pusher transport it degrades gracefully (`status()` returns `offline`, `onChange` emits once, `reconnect` is a no-op). Build it standalone with `createConnectionClient(echo)`.

## Running the package locally

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Current status

Core + Notifications + Custom Channels + Presence (frontend client) are implemented. Chat is reserved for a later version.
