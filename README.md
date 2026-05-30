# pixel-realtime frontend

TypeScript helpers around Laravel Echo and Reverb. The package does not replace Echo; it gives the app a small, typed structure for Pixel Realtime modules.

> New here? Start with the [architecture overview](../docs/architecture.md) and the canonical [contract](../docs/contract.md).

## Install from GitHub

```bash
npm install github:Pixel-Softwares-com/Pixel-frontend-realtime#main
```

## Reverb Echo config

The frontend configures itself directly. There is no backend endpoint that returns realtime config — the package never exposes the Reverb app secret. Set these Vite env values to match the backend `.env`:

```env
VITE_PIXEL_REALTIME_APP_KEY=
VITE_PIXEL_REALTIME_HOST=127.0.0.1
VITE_PIXEL_REALTIME_PORT=8080
VITE_PIXEL_REALTIME_SCHEME=http
```

`VITE_PIXEL_REALTIME_APP_KEY` is the public Reverb / Pusher app key, **not** the Laravel `APP_KEY`. The matching `PIXEL_REALTIME_APP_SECRET` lives on the backend only — never ship it to the browser.

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { createReverbEchoConfig } from 'pixel-realtime';

const echo = new Echo({
  ...createReverbEchoConfig({
    key: import.meta.env.VITE_PIXEL_REALTIME_APP_KEY,
    host: import.meta.env.VITE_PIXEL_REALTIME_HOST,
    port: Number(import.meta.env.VITE_PIXEL_REALTIME_PORT ?? 8080),
    scheme: import.meta.env.VITE_PIXEL_REALTIME_SCHEME === 'https' ? 'https' : 'http',
    authEndpoint: '/broadcasting/auth',
    tokenProvider: () => localStorage.getItem('token'),
  }),
  client: Pusher,
});
```

The factory accepts `key`, `host`, `port`, `scheme`, `authEndpoint`, and `tokenProvider`. It does not accept (or emit) a secret. The real user check happens at `/broadcasting/auth` using your session / Sanctum / JWT — `APP_KEY` is not a substitute for user authentication.

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

## Running the package locally

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Current status

Version 1 ships Core + Notifications + Custom Channels. Chat and Presence / Online Users are reserved for later versions.
