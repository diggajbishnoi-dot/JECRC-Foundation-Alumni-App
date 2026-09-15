import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectSocket(token: string): Socket | null {
  if (!token) return null;

  if (socket && currentToken === token && socket.connected) {
    return socket;
  }

  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }

  const rawUrl = (typeof process !== 'undefined' && process.env?.VITE_API_URL) || 'http://localhost:3000';
  const baseUrl = rawUrl.replace(/\/$/, '');
  const socketUrl = `${baseUrl}/chat`;

  currentToken = token;
  socket = io(socketUrl, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // connected
  });

  socket.on('disconnect', () => {
    // disconnected
  });

  socket.on('connect_error', () => {
    // connection error is non-fatal; socket will auto-reconnect
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
