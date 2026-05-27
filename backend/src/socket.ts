import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'your-secret-key-here';
        const decoded = jwt.verify(token, secret) as { userId: string };
        socket.data.userId = decoded.userId;
      } catch {
        // token inválido: ainda permite salas públicas de caso
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    socket.on('case:subscribe', (caseId: string) => {
      if (caseId && typeof caseId === 'string') {
        socket.join(`case:${caseId}`);
      }
    });

    socket.on('case:unsubscribe', (caseId: string) => {
      if (caseId && typeof caseId === 'string') {
        socket.leave(`case:${caseId}`);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO não inicializado');
  }
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch {
    // servidor ainda subindo ou testes
  }
}

export function emitCaseFeed(caseId: string, payload: unknown): void {
  try {
    getIO().to(`case:${caseId}`).emit('case:feed', payload);
  } catch {
    // ignore
  }
}
