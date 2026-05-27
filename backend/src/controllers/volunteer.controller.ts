import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { onVolunteerPending, onVolunteerStatusChanged } from '../services/realtime.service';

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

    const prior = await prisma.volunteer.findUnique({
      where: {
        userId_caseId: {
          userId: req.userId,
          caseId: validatedData.caseId,
        },
      },
    });

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

    const shouldNotifyOwner =
      volunteer.status === 'PENDING' && (!prior || prior.status === 'REJECTED');

    if (shouldNotifyOwner) {
      const u = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { name: true },
      });
      try {
        await onVolunteerPending(validatedData.caseId, volunteer.id, u?.name ?? 'Alguém');
      } catch (e) {
        console.error('Realtime volunteer:', e);
      }
    }

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
        case: {
          select: {
            id: true,
            userId: true,
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

const updateVolunteerStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const updateVolunteerStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const validated = updateVolunteerStatusSchema.parse(req.body);

    const volunteer = await prisma.volunteer.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!volunteer) {
      throw new AppError('Voluntário não encontrado', 404);
    }

    if (volunteer.case.userId !== req.userId) {
      throw new AppError('Apenas o responsável pelo caso pode aprovar ou rejeitar voluntários', 403);
    }

    const previousStatus = volunteer.status;

    const updated = await prisma.volunteer.update({
      where: { id },
      data: {
        status: validated.status,
      },
    });

    // Ao aprovar voluntário individual, cria/garante um grupo privado
    // (visível somente ao dono via listagem) para troca de informações.
    if (validated.status === 'APPROVED') {
      const ownerId = volunteer.case.userId;
      const volunteerUser = await prisma.user.findUnique({
        where: { id: volunteer.userId },
        select: { name: true },
      });

      const existingPrivateGroup = await prisma.group.findFirst({
        where: {
          caseId: volunteer.caseId,
          leaderId: ownerId,
          isPrivate: true,
          members: {
            some: {
              userId: volunteer.userId,
            },
          },
        },
        select: { id: true },
      });

      if (!existingPrivateGroup) {
        await prisma.group.create({
          data: {
            name: `Contato - ${volunteerUser?.name ?? 'Voluntário'}`,
            description: null,
            isActive: true,
            isPrivate: true,
            caseId: volunteer.caseId,
            leaderId: ownerId,
            members: {
              create: [
                { userId: ownerId, role: 'LEADER' },
                { userId: volunteer.userId, role: 'MEMBER' },
              ],
            },
          },
        });
      } else {
        await prisma.groupMember.upsert({
          where: {
            groupId_userId: {
              groupId: existingPrivateGroup.id,
              userId: volunteer.userId,
            },
          },
          update: { role: 'MEMBER' },
          create: {
            groupId: existingPrivateGroup.id,
            userId: volunteer.userId,
            role: 'MEMBER',
          },
        });
      }

      // Garante que esse voluntário não apareça nos grupos "públicos" do caso,
      // preservando a regra de visibilidade/privacidade.
      const publicGroups = await prisma.group.findMany({
        where: {
          caseId: volunteer.caseId,
          isPrivate: false,
        },
        select: { id: true },
      });

      if (publicGroups.length > 0) {
        await prisma.groupMember.deleteMany({
          where: {
            groupId: { in: publicGroups.map((g) => g.id) },
            userId: volunteer.userId,
            role: { not: 'LEADER' },
          },
        });
      }
    }

    // Se rejeitar, remove do grupo privado relacionado.
    if (validated.status === 'REJECTED') {
      const ownerId = volunteer.case.userId;
      const privateGroups = await prisma.group.findMany({
        where: {
          caseId: volunteer.caseId,
          leaderId: ownerId,
          isPrivate: true,
          members: { some: { userId: volunteer.userId } },
        },
        select: { id: true },
      });

      if (privateGroups.length > 0) {
        await prisma.groupMember.deleteMany({
          where: {
            groupId: { in: privateGroups.map((g) => g.id) },
            userId: volunteer.userId,
            role: { not: 'LEADER' },
          },
        });

        // Se a rejeição removeu a única relação além do líder, remove também o grupo privado.
        const remaining = await Promise.all(
          privateGroups.map(async (g) => {
            const count = await prisma.groupMember.count({
              where: { groupId: g.id },
            });
            return { id: g.id, count };
          }),
        );

        const toDelete = remaining.filter((g) => g.count <= 1).map((g) => g.id);
        if (toDelete.length > 0) {
          await prisma.group.deleteMany({
            where: { id: { in: toDelete } },
          });
        }
      }
    }

    if (
      previousStatus !== validated.status &&
      (validated.status === 'APPROVED' || validated.status === 'REJECTED')
    ) {
      const [volUser, caseRow] = await Promise.all([
        prisma.user.findUnique({
          where: { id: volunteer.userId },
          select: { name: true },
        }),
        prisma.case.findUnique({
          where: { id: volunteer.caseId },
          select: { title: true },
        }),
      ]);
      try {
        await onVolunteerStatusChanged(
          volunteer.caseId,
          volunteer.userId,
          caseRow?.title ?? 'Caso',
          validated.status,
          volunteer.id,
          volUser?.name ?? 'Voluntário',
        );
      } catch (e) {
        console.error('Realtime volunteer status:', e);
      }
    }

    res.json({
      success: true,
      message: 'Status do voluntário atualizado com sucesso',
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

    console.error('Update volunteer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do voluntário',
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

