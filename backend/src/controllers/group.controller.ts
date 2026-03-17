import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(3, 'Nome do grupo deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  caseId: z.string().uuid('ID do caso inválido'),
});

const updateGroupSchema = z.object({
  name: z.string().min(3, 'Nome do grupo deve ter pelo menos 3 caracteres').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const validatedData = createGroupSchema.parse(req.body);

    const existingCase = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: { id: true, status: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    if (existingCase.status !== 'ACTIVE') {
      throw new AppError('Só é possível criar grupo para casos ativos', 400);
    }

    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        caseId: validatedData.caseId,
        leaderId: req.userId,
        members: {
          create: {
            userId: req.userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Grupo criado com sucesso',
      data: group,
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

    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar grupo',
    });
  }
};

export const getGroupsByCase = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;

    const groups = await prisma.group.findMany({
      where: {
        caseId,
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get groups by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar grupos do caso',
    });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { leaderId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
              },
            },
          },
        ],
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          where: {
            userId: req.userId,
          },
          select: {
            role: true,
            joinedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get my groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar grupos',
    });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isActive: true },
    });

    if (!group || !group.isActive) {
      throw new AppError('Grupo não encontrado ou inativo', 404);
    }

    const member = await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: req.userId,
        },
      },
      update: {},
      create: {
        groupId,
        userId: req.userId,
        role: 'MEMBER',
      },
    });

    res.json({
      success: true,
      message: 'Você entrou no grupo',
      data: member,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao entrar no grupo',
    });
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { groupId } = req.params;

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: req.userId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Você saiu do grupo',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sair do grupo',
    });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const validatedData = updateGroupSchema.parse(req.body);

    const group = await prisma.group.findUnique({
      where: { id },
      select: { id: true, leaderId: true },
    });

    if (!group) {
      throw new AppError('Grupo não encontrado', 404);
    }

    if (group.leaderId !== req.userId) {
      throw new AppError('Apenas o líder pode editar o grupo', 403);
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description || null,
        }),
        ...(typeof validatedData.isActive === 'boolean' && {
          isActive: validatedData.isActive,
        }),
      },
    });

    res.json({
      success: true,
      message: 'Grupo atualizado com sucesso',
      data: updated,
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

    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar grupo',
    });
  }
};

