import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const createVolunteerSchema = z.object({
  caseId: z.string().uuid('ID do caso inválido'),
});

export const createVolunteer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const validatedData = createVolunteerSchema.parse(req.body);

    const existingCase = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: { id: true, status: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    if (existingCase.status !== 'ACTIVE') {
      throw new AppError('Não é possível se voluntariar para um caso não ativo', 400);
    }

    const volunteer = await prisma.volunteer.upsert({
      where: {
        userId_caseId: {
          userId: req.userId,
          caseId: validatedData.caseId,
        },
      },
      update: {
        status: 'PENDING',
      },
      create: {
        userId: req.userId,
        caseId: validatedData.caseId,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Solicitação de voluntário enviada com sucesso',
      data: volunteer,
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

    console.error('Create volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao se inscrever como voluntário',
    });
  }
};

export const getVolunteerForCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { caseId } = req.params;

    const volunteer = await prisma.volunteer.findUnique({
      where: {
        userId_caseId: {
          userId: req.userId,
          caseId,
        },
      },
    });

    res.json({
      success: true,
      data: volunteer,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get volunteer for case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status de voluntário',
    });
  }
};

export const getVolunteersByCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { caseId } = req.params;

    const volunteers = await prisma.volunteer.findMany({
      where: { caseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: volunteers,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get volunteers by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar voluntários do caso',
    });
  }
};

export const getMyVolunteers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const volunteers = await prisma.volunteer.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: volunteers,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get my volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar seus voluntariados',
    });
  }
};

