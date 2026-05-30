import { createRealtimeClient, createReverbEchoConfig } from '../src/index';

const echoConfig = createReverbEchoConfig({
  key: import.meta.env.VITE_PIXEL_REALTIME_APP_KEY,
  host: import.meta.env.VITE_PIXEL_REALTIME_HOST,
  port: Number(import.meta.env.VITE_PIXEL_REALTIME_PORT ?? 8080),
  scheme: import.meta.env.VITE_PIXEL_REALTIME_SCHEME === 'https' ? 'https' : 'http',
  tokenProvider: () => localStorage.getItem('token'),
});

// Create your Echo instance in the app with echoConfig, then pass it here.
declare const echo: {
  private(channel: string): {
    listen(event: string, callback: (payload: unknown) => void): unknown;
    stopListening?(event: string, callback?: (payload: unknown) => void): unknown;
  };
};

const realtime = createRealtimeClient({
  echo,
  userId: 15,
  api: {
    baseUrl: '/pixel-realtime',
    tokenProvider: () => localStorage.getItem('token'),
  },
});

realtime.notifications.listen((notification) => {
  console.log(notification.type, notification.data);
});

console.log(echoConfig, realtime.privateUserChannel());
