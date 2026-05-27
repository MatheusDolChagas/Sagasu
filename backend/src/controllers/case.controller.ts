import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateImageUrlForPlatform } from '../services/mediaValidation.service';

// Schema de validação para criar caso
const createCaseSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  missingPersonName: z.string().min(2, 'Nome da pessoa desaparecida é obrigatório'),
  age: z.number().int().min(60, 'Este sistema é destinado a idosos (idade mínima de 60 anos).').optional(),
  gender: z.string().optional(),
  lastSeenLocation: z.string().optional(),
  lastSeenLatitude: z.number().gte(-90).lte(90).optional(),
  lastSeenLongitude: z.number().gte(-180).lte(180).optional(),
  lastSeenDate: z.string().optional(),
  /** URL pública da foto (ex.: Supabase Storage), associada como mídia IMAGE */
  photoUrl: z.string().url('URL da foto inválida').optional(),
});

const updateCaseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  missingPersonName: z.string().min(2).optional(),
  age: z
    .number()
    .int()
    .min(60, 'Este sistema é destinado a idosos (idade mínima de 60 anos).')
    .optional()
    .nullable(),
  gender: z.string().optional().nullable(),
  lastSeenLocation: z.string().optional().nullable(),
  lastSeenLatitude: z.number().gte(-90).lte(90).optional().nullable(),
  lastSeenLongitude: z.number().gte(-180).lte(180).optional().nullable(),
  lastSeenDate: z.string().optional().nullable(),
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

    if (validatedData.photoUrl) {
      const mediaCheck = await validateImageUrlForPlatform(
        validatedData.photoUrl,
        'case_primary',
      );
      if (!mediaCheck.ok) {
        throw new AppError(
          mediaCheck.reason || 'Foto recusada pela validação automática de mídia',
          400,
        );
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
        lastSeenLatitude: validatedData.lastSeenLatitude ?? null,
        lastSeenLongitude: validatedData.lastSeenLongitude ?? null,
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
        media: true,
      },
    });

    if (validatedData.photoUrl) {
      await prisma.media.create({
        data: {
          caseId: newCase.id,
          url: validatedData.photoUrl,
          type: 'IMAGE',
        },
      });
    }

    const fullCase = await prisma.case.findUnique({
      where: { id: newCase.id },
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

    res.status(201).json({
      success: true,
      message: 'Caso criado com sucesso',
      data: fullCase,
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

/** Linha do tempo: dicas, voluntários e avistamentos (ordenado por data). */
export const getCaseFeed = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const exists = await prisma.case.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!exists) {
      throw new AppError('Caso não encontrado', 404);
    }

    const isOwner = !!req.userId && exists.userId === req.userId;

    const [tips, volunteers, sightings] = await Promise.all([
      prisma.tip.findMany({
        where: { caseId: id },
        select: { id: true, createdAt: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
      prisma.volunteer.findMany({
        where: {
          caseId: id,
          ...(isOwner ? {} : { status: 'APPROVED' }),
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.sighting.findMany({
        where: { caseId: id },
        select: {
          id: true,
          createdAt: true,
          photoUrl: true,
          description: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    const rows = [
      ...tips.map((t) => ({
        type: 'TIP' as const,
        id: t.id,
        createdAt: t.createdAt.toISOString(),
        preview: t.content.slice(0, 200),
      })),
      ...volunteers.map((v) => ({
        type: 'VOLUNTEER' as const,
        id: v.id,
        createdAt: v.createdAt.toISOString(),
        volunteerName: v.user.name,
        status: v.status,
      })),
      ...sightings.map((s) => ({
        type: 'SIGHTING' as const,
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        photoUrl: s.photoUrl,
        description: s.description,
      })),
    ];

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: rows,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Get case feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar feed do caso',
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

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const existing = await prisma.case.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      throw new AppError('Caso não encontrado', 404);
    }

    if (existing.userId !== req.userId) {
      throw new AppError('Sem permissão para editar este caso', 403);
    }

    const validated = updateCaseSchema.parse(req.body);

    let lastSeenDate: Date | null | undefined = undefined;
    if (validated.lastSeenDate !== undefined) {
      if (validated.lastSeenDate === null || validated.lastSeenDate === '') {
        lastSeenDate = null;
      } else {
        const d = new Date(validated.lastSeenDate);
        if (isNaN(d.getTime())) {
          throw new AppError('Data inválida', 400);
        }
        lastSeenDate = d;
      }
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.missingPersonName !== undefined && {
          missingPersonName: validated.missingPersonName,
        }),
        ...(validated.age !== undefined && { age: validated.age }),
        ...(validated.gender !== undefined && { gender: validated.gender }),
        ...(validated.lastSeenLocation !== undefined && {
          lastSeenLocation: validated.lastSeenLocation,
        }),
        ...(validated.lastSeenLatitude !== undefined && {
          lastSeenLatitude: validated.lastSeenLatitude,
        }),
        ...(validated.lastSeenLongitude !== undefined && {
          lastSeenLongitude: validated.lastSeenLongitude,
        }),
        ...(lastSeenDate !== undefined && { lastSeenDate }),
      },
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

    res.json({
      success: true,
      message: 'Caso atualizado',
      data: updated,
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

    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar caso',
    });
  }
};

/** Pacote para encaminhar a autoridades (dono do caso ou perfil POLICE/ADMIN) */
export const exportCaseForAuthorities = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        media: true,
        tips: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        volunteers: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        sightings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseItem) {
      throw new AppError('Caso não encontrado', 404);
    }

    const requester = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, role: true },
    });

    const isOwner = caseItem.userId === req.userId;
    const isAuthority =
      requester?.role === 'POLICE' || requester?.role === 'ADMIN' || requester?.role === 'NGO';

    if (!isOwner && !isAuthority) {
      throw new AppError('Sem permissão para exportar este caso', 403);
    }

    const exportedAt = new Date().toISOString();

    const sanitizeTips = caseItem.tips.map((t) => ({
      id: t.id,
      content: t.content,
      location: t.location,
      latitude: t.latitude,
      longitude: t.longitude,
      isAnonymous: t.isAnonymous,
      isVerified: t.isVerified,
      createdAt: t.createdAt,
      informant:
        t.isAnonymous || !t.user
          ? null
          : {
              name: t.user.name,
              email: t.user.email,
            },
    }));

    const payload = {
      exportedAt,
      exportPurpose: 'Encaminhamento a órgãos de segurança / autoridades',
      case: {
        id: caseItem.id,
        title: caseItem.title,
        description: caseItem.description,
        missingPersonName: caseItem.missingPersonName,
        age: caseItem.age,
        gender: caseItem.gender,
        lastSeenLocation: caseItem.lastSeenLocation,
        lastSeenLatitude: caseItem.lastSeenLatitude,
        lastSeenLongitude: caseItem.lastSeenLongitude,
        lastSeenDate: caseItem.lastSeenDate,
        status: caseItem.status,
        isVerified: caseItem.isVerified,
        createdAt: caseItem.createdAt,
        updatedAt: caseItem.updatedAt,
      },
      contactResponsible: {
        name: caseItem.user.name,
        email: caseItem.user.email,
        phone: caseItem.user.phone,
      },
      media: caseItem.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        isVerified: m.isVerified,
      })),
      tips: sanitizeTips,
      volunteers: caseItem.volunteers.map((v) => ({
        id: v.id,
        status: v.status,
        name: v.user.name,
        email: v.user.email,
      })),
      sightings: caseItem.sightings.map((s) => ({
        id: s.id,
        description: s.description,
        latitude: s.latitude,
        longitude: s.longitude,
        photoUrl: s.photoUrl,
        createdAt: s.createdAt,
      })),
    };

    const format = (req.query.format as string) || 'json';

    if (format === 'txt') {
      const lines = [
        `SAGASU — RELATÓRIO PARA AUTORIDADES`,
        `Gerado em: ${exportedAt}`,
        ``,
        `CASO: ${payload.case.title}`,
        `Pessoa desaparecida: ${payload.case.missingPersonName}`,
        `Status: ${payload.case.status}`,
        ``,
        `DESCRIÇÃO:`,
        payload.case.description,
        ``,
        `Último local (texto): ${payload.case.lastSeenLocation ?? '—'}`,
        `Coordenadas último avistamento conhecido: ${
          payload.case.lastSeenLatitude != null && payload.case.lastSeenLongitude != null
            ? `${payload.case.lastSeenLatitude}, ${payload.case.lastSeenLongitude}`
            : '—'
        }`,
        ``,
        `CONTATO DO RESPONSÁVEL:`,
        `Nome: ${payload.contactResponsible.name}`,
        `E-mail: ${payload.contactResponsible.email}`,
        `Telefone: ${payload.contactResponsible.phone ?? '—'}`,
        ``,
        `DICAS (${payload.tips.length}):`,
        ...payload.tips.map(
          (t, i) =>
            `${i + 1}. ${t.content}\n   Local: ${t.location ?? '—'}\n   Coords: ${t.latitude ?? '—'}, ${t.longitude ?? '—'}\n   Data: ${t.createdAt}`,
        ),
        ``,
        `AVISTAMENTOS COM FOTO (${payload.sightings.length}):`,
        ...payload.sightings.map(
          (s, i) =>
            `${i + 1}. ${s.description ?? '(sem descrição)'}\n   Foto: ${s.photoUrl}\n   Coords: ${s.latitude}, ${s.longitude}\n   Data: ${s.createdAt}`,
        ),
        ``,
        `MÍDIA (${payload.media.length}):`,
        ...payload.media.map((m) => `- ${m.type}: ${m.url}`),
      ];

      const body = lines.join('\n');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="sagasu-caso-${caseItem.id.slice(0, 8)}-autoridades.txt`,
      );
      return res.send(body);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sagasu-caso-${caseItem.id.slice(0, 8)}-autoridades.json`,
    );
    res.send(JSON.stringify(payload, null, 2));
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Export case error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar caso',
    });
  }
};
