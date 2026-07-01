import PusherClient from 'pusher-js';

const isClient = typeof window !== 'undefined';

if (isClient && process.env.NODE_ENV !== 'production') {
  PusherClient.logToConsole = true;
}

export const pusherClient = isClient 
  ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      authEndpoint: '/api/pusher/auth',
    })
  : ({} as any);

