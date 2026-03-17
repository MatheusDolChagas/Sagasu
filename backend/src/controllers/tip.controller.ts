import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const createTipSchema = z.object({
  content: z.string().min(5, 'Conteúdo da dica deve ter pelo menos 5 caracteres'),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isAnonymous: z.boolean().optional().default(true),
});

export const createTip = async (req: AuthRequest | Request, res: Response) => {
  try {
    const { caseId } = req.params;

    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    const validatedData = createTipSchema.parse(req.body);

    let userId: string | null = null;

    if ('userId' in req && req.userId && !validatedData.isAnonymous) {
      userId = req.userId;
    }

    const tip = await prisma.tip.create({
      data: {
        content: validatedData.content,
        location: validatedData.location || null,
        latitude: validatedData.latitude ?? null,
        longitude: validatedData.longitude ?? null,
        isAnonymous: validatedData.isAnonymous ?? true,
        caseId,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Dica enviada com sucesso',
      data: tip,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Create tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar dica',
    });
  }
};

export const getTipsByCase = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;

    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    const tips = await prisma.tip.findMany({
      where: { caseId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: tips,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get tips by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dicas',
    });
  }
};

