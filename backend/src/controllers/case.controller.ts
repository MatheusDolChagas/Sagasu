import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

// Schema de validação para criar caso
const createCaseSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  missingPersonName: z.string().min(2, 'Nome da pessoa desaparecida é obrigatório'),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  lastSeenLocation: z.string().optional(),
  lastSeenDate: z.string().optional(),
});

export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Validar dados
    const validatedData = createCaseSchema.parse(req.body);

    // Converter lastSeenDate se fornecido
    let lastSeenDate: Date | undefined;
    if (validatedData.lastSeenDate) {
      lastSeenDate = new Date(validatedData.lastSeenDate);
      if (isNaN(lastSeenDate.getTime())) {
        throw new AppError('Data inválida', 400);
      }
    }

    // Criar caso
    const newCase = await prisma.case.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        missingPersonName: validatedData.missingPersonName,
        age: validatedData.age || null,
        gender: validatedData.gender || null,
        lastSeenLocation: validatedData.lastSeenLocation || null,
        lastSeenDate: lastSeenDate || null,
        userId: req.userId,
        status: 'ACTIVE',
        isVerified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Caso criado com sucesso',
      data: newCase,
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

    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar caso',
    });
  }
};

export const getCases = async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar casos',
    });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        media: true,
      },
    });

    if (!caseItem) {
      throw new AppError('Caso não encontrado', 404);
    }

    res.json({
      success: true,
      data: caseItem,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get case by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar caso',
    });
  }
};

export const getMyCases = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const cases = await prisma.case.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get my cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar seus casos',
    });
  }
};
