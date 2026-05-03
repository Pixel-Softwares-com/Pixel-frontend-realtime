# pixel-realtime frontend

TypeScript helpers around Laravel Echo and Reverb. The package does not replace Echo; it gives the app a small, typed structure for Pixel Realtime modules.

## Install from GitHub

```bash
npm install github:Pixel-Softwares-com/Pixel-frontend-realtime#main
```

## Reverb Echo config

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { createReverbEchoConfig } from 'pixel-realtime';

const echo = new Echo({
  ...createReverbEchoConfig({
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    scheme: import.meta.env.VITE_REVERB_SCHEME === 'https' ? 'https' : 'http',
    tokenProvider: () => localStorage.getItem('token'),
  }),
  client: Pusher,
});
```

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

## Current status

Version 1 focuses on Core + Notifications. Chat, Custom Channels, and Presence / Online Users are reserved for later versions.
