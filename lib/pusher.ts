import PusherServer from 'pusher';

// Keep this strictly on the server to prevent exposing the secret
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});
