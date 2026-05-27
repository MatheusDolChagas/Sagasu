import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './config/database';

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

    socket.on('group:subscribe', async (groupId: string) => {
      if (!groupId || typeof groupId !== 'string' || !socket.data.userId) return;
      try {
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: {
            leaderId: true,
            isPrivate: true,
            case: { select: { userId: true } },
            members: { select: { userId: true } },
          },
        });
        if (!group) return;
        const userId = socket.data.userId as string;
        const isCaseOwner = group.case.userId === userId;
        const isMember =
          group.leaderId === userId ||
          group.members.some((m) => m.userId === userId);
        if (isMember || isCaseOwner || !group.isPrivate) {
          socket.join(`group:${groupId}`);
        }
      } catch {
        // ignore
      }
    });

    socket.on('group:unsubscribe', (groupId: string) => {
      if (groupId && typeof groupId === 'string') {
        socket.leave(`group:${groupId}`);
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

export function emitGroupMessage(groupId: string, payload: unknown): void {
  try {
    getIO().to(`group:${groupId}`).emit('group:message', payload);
  } catch {
    // ignore
  }
}

export function emitGroupMembers(groupId: string, payload: unknown): void {
  try {
    getIO().to(`group:${groupId}`).emit('group:members', payload);
  } catch {
    // ignore
  }
}
