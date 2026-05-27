import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { onSightingCreated } from '../services/realtime.service';
import { validateImageUrlForPlatform } from '../services/mediaValidation.service';

const createSightingSchema = z.object({
  caseId: z.string().uuid(),
  description: z.string().max(5000).optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  photoUrl: z.string().url('URL da foto inválida'),
});

export const createSighting = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const validated = createSightingSchema.parse(req.body);

    const existingCase = await prisma.case.findUnique({
      where: { id: validated.caseId },
      select: { id: true, status: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    if (existingCase.status !== 'ACTIVE') {
      throw new AppError('Não é possível registrar avistamento neste caso', 400);
    }

    const mediaCheck = await validateImageUrlForPlatform(validated.photoUrl);
    if (!mediaCheck.ok) {
      throw new AppError(
        mediaCheck.reason || 'Foto recusada pela validação automática de mídia',
        400,
      );
    }

    const sighting = await prisma.sighting.create({
      data: {
        caseId: validated.caseId,
        userId: req.userId,
        description: validated.description || null,
        latitude: validated.latitude,
        longitude: validated.longitude,
        photoUrl: validated.photoUrl,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            missingPersonName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    try {
      await onSightingCreated(
        validated.caseId,
        sighting.id,
        sighting.photoUrl,
        sighting.description,
      );
    } catch (e) {
      console.error('Realtime sighting:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Avistamento registrado com sucesso',
      data: sighting,
    });
  } catch (error: unknown) {
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

    console.error('Create sighting error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar avistamento',
    });
  }
};

export const getSightings = async (_req: Request, res: Response) => {
  try {
    const list = await prisma.sighting.findMany({
      include: {
        case: {
          select: {
            id: true,
            title: true,
            missingPersonName: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('Get sightings error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar avistamentos',
    });
  }
};

export const getSightingsByCase = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;

    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    const list = await prisma.sighting.findMany({
      where: { caseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get sightings by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar avistamentos',
    });
  }
};
