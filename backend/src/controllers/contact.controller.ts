import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';

const submitSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

export const submitContact = async (req: Request, res: Response) => {
  try {
    const data = submitSchema.parse(req.body);
    const row = await prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
      },
    });
    res.status(201).json({
      success: true,
      message: 'Mensagem enviada. Entraremos em contato quando possível.',
      data: { id: row.id },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('submitContact:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar mensagem' });
  }
};

const authorityRoles = ['ADMIN', 'POLICE', 'NGO'] as const;

export const listContactInbox = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Não autenticado', 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!user || !authorityRoles.includes(user.role as (typeof authorityRoles)[number])) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    const items = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json({ success: true, data: items });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error('listContactInbox:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar mensagens' });
  }
};
