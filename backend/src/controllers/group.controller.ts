import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitGroupMessage, emitToUser } from '../socket';
import { onGroupMessageCreated } from '../services/groupMessageNotify.service';
import { notifyGroupMembersChanged } from '../services/groupRealtime.service';
import { withGroupDisplayName } from '../utils/groupDisplay';
import {
  countUnreadByGroups,
  countUnreadInGroup,
  markGroupAsRead,
} from '../utils/groupUnread';
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

const createGroupCommentSchema = z.object({
  content: z.string().trim().max(5000).optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
});

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const validatedData = createGroupSchema.parse(req.body);

    const existingCase = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: { id: true, status: true, userId: true },
    });

    if (!existingCase) {
      throw new AppError('Caso não encontrado', 404);
    }

    if (existingCase.status !== 'ACTIVE') {
      throw new AppError('Só é possível criar grupo para casos ativos', 400);
    }

    // Permissão para criar grupo:
    // - responsável pelo caso (case.userId)
    // - ou voluntário individual Aprovado para este mesmo caso
    const isCaseOwner = existingCase.userId === req.userId;
    if (!isCaseOwner) {
      const volunteer = await prisma.volunteer.findUnique({
        where: {
          userId_caseId: {
            userId: req.userId,
            caseId: validatedData.caseId,
          },
        },
        select: { status: true },
      });

      if (!volunteer || volunteer.status !== 'APPROVED') {
        throw new AppError(
          'Somente o responsável pelo caso ou um voluntário individual aprovado pode criar grupos',
          403,
        );
      }
    }

    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        caseId: validatedData.caseId,
        leaderId: req.userId,
        isPrivate: false,
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
            status: true,
            missingPersonName: true,
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

    await notifyGroupMembersChanged(group.id);

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

export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    const group = await (prisma as any).group.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true,
            missingPersonName: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    });

    if (!group) {
      throw new AppError('Grupo não encontrado', 404);
    }

    const isLeader = group.leaderId === req.userId;
    const isMember = (group.members as any[]).some((m: any) => m.user?.id === req.userId);
    const isCaseOwner = group.case?.userId === req.userId;
    if (!isLeader && !isMember && !isCaseOwner) {
      throw new AppError('Acesso negado', 403);
    }

    res.json({
      success: true,
      data: withGroupDisplayName(group, req.userId!),
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get group by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar grupo',
    });
  }
};

export const createGroupComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id: groupId } = req.params;
    const validated = createGroupCommentSchema.parse(req.body);
    const content = validated.content?.trim() || null;
    const imageUrl = validated.imageUrl ?? null;

    if (!content && !imageUrl) {
      throw new AppError('Envie um comentário em texto ou uma imagem', 400);
    }

    const group = await (prisma as any).group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: { user: { select: { id: true } } },
        },
      },
    });

    if (!group) {
      throw new AppError('Grupo não encontrado', 404);
    }

    const isLeader = group.leaderId === req.userId;
    const isMember = (group.members as any[]).some((m: any) => m.user?.id === req.userId);
    if (!isLeader && !isMember) {
      throw new AppError('Acesso negado', 403);
    }

    const comment = await (prisma as any).groupComment.create({
      data: {
        groupId,
        userId: req.userId,
        content,
        imageUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    emitGroupMessage(groupId, comment);

    const authorName =
      (comment.user as { name?: string } | undefined)?.name ?? 'Alguém';
    const preview =
      content ??
      (imageUrl ? '[imagem]' : '');
    void onGroupMessageCreated(groupId, req.userId, authorName, preview);

    res.status(201).json({
      success: true,
      message: 'Comentário enviado',
      data: comment,
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

    console.error('Create group comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar comentário',
    });
  }
};

export const getGroupsByCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { caseId } = req.params;

    const groups = await prisma.group.findMany({
      where: {
        caseId,
        OR: [
          { isPrivate: false },
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
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: groups.map((g) =>
        withGroupDisplayName(g, req.userId!),
      ),
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
            status: true,
            userId: true,
            missingPersonName: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const groupIds = groups.map((g) => g.id);
    const unreadMap = await countUnreadByGroups(req.userId, groupIds);

    res.json({
      success: true,
      data: groups.map((g) => ({
        ...withGroupDisplayName(g, req.userId!),
        unreadCount: unreadMap[g.id] ?? 0,
      })),
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

export const markGroupMessagesRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id: groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        leaderId: true,
        isPrivate: true,
        case: { select: { userId: true } },
        members: { select: { userId: true } },
      },
    });

    if (!group) {
      throw new AppError('Grupo não encontrado', 404);
    }

    const isLeader = group.leaderId === req.userId;
    const isMember = group.members.some((m) => m.userId === req.userId);
    const isCaseOwner = group.case?.userId === req.userId;
    if (!isLeader && !isMember && !isCaseOwner) {
      throw new AppError('Acesso negado', 403);
    }

    await markGroupAsRead(req.userId, groupId);
    const unreadCount = await countUnreadInGroup(req.userId, groupId);
    emitToUser(req.userId, 'group:unread', { groupId, unreadCount });

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas',
      data: { groupId, unreadCount },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Mark group messages read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar mensagens como lidas',
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
      select: { id: true, isActive: true, isPrivate: true, caseId: true },
    });

    if (!group || !group.isActive) {
      throw new AppError('Grupo não encontrado ou inativo', 404);
    }

    if (group.isPrivate) {
      throw new AppError('Este grupo é privado e não aceita novos membros', 403);
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

    await notifyGroupMembersChanged(groupId);

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

    await notifyGroupMembersChanged(groupId);

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

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      select: { id: true, leaderId: true },
    });

    if (!group) {
      throw new AppError('Grupo não encontrado', 404);
    }

    if (group.leaderId !== req.userId) {
      throw new AppError('Apenas o líder pode remover o grupo', 403);
    }

    await prisma.group.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Grupo removido com sucesso',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover grupo',
    });
  }
};

