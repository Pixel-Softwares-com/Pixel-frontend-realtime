import { createRealtimeClient, createReverbEchoConfig } from '../src/index';

// The package reads no env itself — your bundler does, then you pass plain values.
// CRA / webpack: process.env.REACT_APP_*   |   Vite: import.meta.env.VITE_*
const echoConfig = createReverbEchoConfig({
  key: process.env.REACT_APP_PIXEL_REALTIME_APP_KEY as string,
  host: process.env.REACT_APP_PIXEL_REALTIME_HOST,
  port: Number(process.env.REACT_APP_PIXEL_REALTIME_PORT ?? 8080),
  scheme: process.env.REACT_APP_PIXEL_REALTIME_SCHEME === 'https' ? 'https' : 'http',
  tokenProvider: () => localStorage.getItem('token'),
});

// Create your Echo instance in the app with echoConfig (and `window.Pusher = Pusher`),
// then pass it here. It must support both private() and join() for presence.
declare const echo: {
  private(channel: string): {
    listen(event: string, callback: (payload: unknown) => void): unknown;
    stopListening?(event: string, callback?: (payload: unknown) => void): unknown;
  };
  join(channel: string): {
    here(cb: (members: unknown[]) => void): unknown;
    joining(cb: (member: unknown) => void): unknown;
    leaving(cb: (member: unknown) => void): unknown;
    listen(event: string, callback: (payload: unknown) => void): unknown;
    stopListening?(event: string, callback?: (payload: unknown) => void): unknown;
  };
  leave?(channel: string): void;
};

const realtime = createRealtimeClient({
  echo,
  userId: 15,
  api: {
    baseUrl: '/pixel-realtime',
    tokenProvider: () => localStorage.getItem('token'),
  },
});

// Stored notifications on user.{id}
realtime.notifications.listen((notification) => {
  console.log(notification.type, notification.data);
});

// Per-resource private channel (server dispatches; frontend listens)
realtime.channel('orders', 15).listen<{ status: string }>('order.updated', (payload) => {
  console.log('order status:', payload.status);
});

// Per-resource presence channel — live roster + join/leave + dispatched events
realtime
  .presence('report', 5)
  .here((members) => console.log('here:', members))
  .joining((member) => console.log('joined:', member))
  .leaving((member) => console.log('left:', member));

console.log(echoConfig, realtime.privateUserChannel());
