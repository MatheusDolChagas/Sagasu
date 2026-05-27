import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../utils/errors';
import {
  validateImageUrlForPlatform,
  humanizeMediaValidationError,
} from '../services/mediaValidation.service';
import prisma from '../config/database';

const bodySchema = z.object({
  imageUrl: z.string().url('URL inválida'),
  context: z.enum(['general', 'avatar', 'case_primary']).optional().default('general'),
});

/** Pré-validação após upload (ex.: Supabase); requer usuário autenticado. */
export const validateMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }
    const { imageUrl, context } = bodySchema.parse(req.body);
    const result = await validateImageUrlForPlatform(
      imageUrl,
      context as Parameters<typeof validateImageUrlForPlatform>[1],
    );
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.reason || 'Imagem não aceita',
        data: { nsfwScore: result.nsfwScore, warnings: result.warnings },
      });
    }
    res.json({
      success: true,
      message: 'Imagem aceita pela validação',
      data: {
        mode: result.mode,
        nsfwScore: result.nsfwScore,
        warnings: result.warnings,
      },
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
    const raw = error instanceof Error ? error.message : 'Erro ao validar mídia';
    console.error('validateMedia:', error);
    res.status(400).json({
      success: false,
      message: humanizeMediaValidationError(raw),
    });
  }
};

const attachCaseMediaSchema = z.object({
  imageUrl: z.string().url('URL inválida'),
});

/** Dono do caso pode anexar fotos adicionais (roupas, objetos, etc.). */
export const attachCaseMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) throw new AppError('Usuário não autenticado', 401);
    const { caseId } = req.params;
    const { imageUrl } = attachCaseMediaSchema.parse(req.body);

    const caseRow = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, userId: true },
    });
    if (!caseRow) throw new AppError('Caso não encontrado', 404);
    if (caseRow.userId !== req.userId) {
      throw new AppError('Apenas o dono do caso pode anexar fotos', 403);
    }

    const validation = await validateImageUrlForPlatform(imageUrl, 'general');
    if (!validation.ok) {
      throw new AppError(validation.reason || 'Imagem recusada pela validação', 400);
    }

    const media = await prisma.media.create({
      data: {
        caseId,
        url: imageUrl,
        type: 'IMAGE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Foto anexada ao caso',
      data: media,
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
    console.error('attachCaseMedia:', error);
    res.status(500).json({ success: false, message: 'Erro ao anexar foto ao caso' });
  }
};

const promoteSightingSchema = z.object({
  sightingId: z.string().uuid('ID do avistamento inválido'),
});

/** Dono do caso pode promover foto do avistamento para mídia pública do caso. */
export const promoteSightingToCaseMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) throw new AppError('Usuário não autenticado', 401);
    const { caseId } = req.params;
    const { sightingId } = promoteSightingSchema.parse(req.body);

    const caseRow = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, userId: true },
    });
    if (!caseRow) throw new AppError('Caso não encontrado', 404);
    if (caseRow.userId !== req.userId) {
      throw new AppError('Apenas o dono do caso pode promover avistamentos', 403);
    }

    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
      select: { id: true, caseId: true, photoUrl: true },
    });
    if (!sighting || sighting.caseId !== caseId) {
      throw new AppError('Avistamento não encontrado para este caso', 404);
    }

    const existing = await prisma.media.findFirst({
      where: { caseId, url: sighting.photoUrl, type: 'IMAGE' },
      select: { id: true },
    });
    if (existing) {
      return res.json({
        success: true,
        message: 'Esta foto de avistamento já está em Fotos e anexos',
        data: { id: existing.id, url: sighting.photoUrl },
      });
    }

    const media = await prisma.media.create({
      data: {
        caseId,
        url: sighting.photoUrl,
        type: 'IMAGE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Foto do avistamento adicionada em Fotos e anexos',
      data: media,
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
    console.error('promoteSightingToCaseMedia:', error);
    res.status(500).json({ success: false, message: 'Erro ao promover avistamento' });
  }
};
