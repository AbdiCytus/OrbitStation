import Pusher from 'pusher-js';

const isClient = typeof window !== 'undefined';
const PusherConstructor = (Pusher as any).default || Pusher;

if (isClient) {
  PusherConstructor.logToConsole = process.env.NODE_ENV !== 'production';
}

export const pusherClient = isClient 
  ? new PusherConstructor(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      authEndpoint: '/api/pusher/auth',
    })
  : {
      subscribe: () => ({ bind: () => {}, unbind: () => {}, bind_global: () => {}, unbind_global: () => {} }),
      unsubscribe: () => {},
      channel: () => ({ trigger: () => {} })
    } as any;
