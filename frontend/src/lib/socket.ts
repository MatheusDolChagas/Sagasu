import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  const token = localStorage.getItem('token');
  socket.auth = { token: token || undefined };
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function reconnectSocketWithAuth(): void {
  const token = localStorage.getItem('token');
  if (!socket) {
    getSocket();
    return;
  }
  socket.auth = { token: token || undefined };
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
