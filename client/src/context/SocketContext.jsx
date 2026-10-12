import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import queryClient from '../lib/queryClient';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user }   = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef  = useRef(null);

  useEffect(() => {
    let token = null;
    const init = async () => {
      if (user) {
        token = await user.getIdToken().catch(() => null);
      }
      const socket = getSocket(token);
      socketRef.current = socket;

      socket.on('connect',    () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      // Invalidate TanStack Query caches on socket events
      socket.on('stats:update',      () => queryClient.invalidateQueries({ queryKey: ['stats'] }));
      socket.on('donor:created',     () => queryClient.invalidateQueries({ queryKey: ['donors'] }));
      socket.on('donor:updated',     () => queryClient.invalidateQueries({ queryKey: ['donors'] }));
      socket.on('request:created',   () => queryClient.invalidateQueries({ queryKey: ['requests'] }));
      socket.on('request:updated',   () => queryClient.invalidateQueries({ queryKey: ['requests'] }));
      socket.on('request:expired',   () => queryClient.invalidateQueries({ queryKey: ['requests'] }));
      socket.on('medicine:created',  () => queryClient.invalidateQueries({ queryKey: ['medicines'] }));
      socket.on('medicine:updated',  () => queryClient.invalidateQueries({ queryKey: ['medicines'] }));
      socket.on('medicine:removed',  () => queryClient.invalidateQueries({ queryKey: ['medicines'] }));
      socket.on('hospital:approved', () => queryClient.invalidateQueries({ queryKey: ['hospitals'] }));
    };

    init();

    return () => {
      if (socketRef.current?.removeAllListeners) {
        socketRef.current.removeAllListeners();
      }
    };
  }, [user]);

  const value = {
    connected,
    socket: socketRef.current,
    on: (evt, handler) => socketRef.current?.on?.(evt, handler),
    off: (evt, handler) => socketRef.current?.off?.(evt, handler),
    emit: (evt, data) => socketRef.current?.emit?.(evt, data),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
