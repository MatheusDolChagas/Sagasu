import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Socket único: JWT no handshake para sala `user:{id}` (notificações). */
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

/** Após login/logout, reconecta com token atual (salas de usuário). */
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
