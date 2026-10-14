import { io } from 'socket.io-client';

let socket;

export function getSocket(token) {
  if (!socket || !socket.connected) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL 
      ? import.meta.env.VITE_SOCKET_URL 
      : import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:5000');

    socket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 4,
      reconnectionDelay: 4000,
      timeout: 8000,
    });

    socket.on('connect_error', (err) => {
      // Silently fall back if the backend is serverless / host doesn't support persistent WebSockets
      console.warn('Realtime sync status:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, disconnectSocket };
