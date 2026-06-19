import PusherClient from 'pusher-js';

// Enable pusher logging - don't include this in production
PusherClient.logToConsole = process.env.NODE_ENV !== 'production';

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  authEndpoint: '/api/pusher/auth',
});
