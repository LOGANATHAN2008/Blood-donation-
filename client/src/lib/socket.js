import { io } from 'socket.io-client';

let socket;

export function getSocket(token) {
  if (!socket || !socket.connected) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
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
