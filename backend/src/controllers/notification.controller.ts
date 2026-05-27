import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const take = Math.min(Number(req.query.limit) || 40, 100);

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          case: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: req.userId, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      data: items,
      unreadCount,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações',
    });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      throw new AppError('Notificação não encontrada', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar notificação',
    });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Todas marcadas como lidas',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar notificações',
    });
  }
};
