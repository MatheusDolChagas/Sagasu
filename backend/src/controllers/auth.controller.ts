import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Prisma, UserRole } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateImageUrlForPlatform } from '../services/mediaValidation.service';
import {
  generateVerificationToken,
  sendSignupVerificationEmail,
  devVerificationLinkIfAllowed,
} from '../services/emailVerification.service';

/** Resposta pública + senha no login; `select` tipado assim evita divergência IDE/cliente Prisma. */
type UserLoginRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
};

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
} as const satisfies Record<string, boolean>;

const LOGIN_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  password: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  emailVerified: true,
} as const satisfies Record<string, boolean>;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .transform((s) => s.toLowerCase());

// Schema de validação para registro
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: emailSchema,
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema de validação para login
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const register = async (req: Request, res: Response) => {
  try {
    // Validar dados
    const validatedData = registerSchema.parse(req.body);

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new AppError('Email já cadastrado', 400);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const { token: verifyToken, expiresAt } = generateVerificationToken();

    // Criar usuário (login liberado após clicar no link enviado por email)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        password: hashedPassword,
        role: 'USER',
        emailVerified: false,
        emailVerificationToken: verifyToken,
        emailVerificationExpires: expiresAt,
      },
      select: USER_PUBLIC_SELECT as Prisma.UserSelect,
    });

    const mail = await sendSignupVerificationEmail(user.email, user.name, verifyToken);
    const emailDispatched = mail.sent;
    const devVerificationLink =
      !mail.sent ? mail.devLink ?? devVerificationLinkIfAllowed(verifyToken) : undefined;

    let message = emailDispatched
      ? 'Cadastro criado. Enviamos um link de confirmação para o seu email.'
      : mail.emailError
        ? `Cadastro criado, mas o email não foi enviado: ${mail.emailError}`
        : 'Cadastro criado. Configure o envio de email ou use o link abaixo para confirmar.';

    res.status(201).json({
      success: true,
      message,
      data: {
        user,
        needsEmailVerification: true,
        emailDispatched,
        ...(mail.emailError ? { emailError: mail.emailError } : {}),
        ...(devVerificationLink ? { devVerificationLink } : {}),
      },
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

    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validar dados
    const validatedData = loginSchema.parse(req.body);

    // Buscar usuário
    const user = (await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: LOGIN_SELECT as Prisma.UserSelect,
    })) as UserLoginRow | null;

    if (!user) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new AppError('Usuário inativo', 403);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    if (!user.emailVerified) {
      throw new AppError(
        'Confirme seu email antes de entrar. Verifique a caixa de entrada (e o spam) ou use «Reenviar confirmação» na tela de login.',
        403,
      );
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        token,
      },
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

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
    });
  }
};

const verifyEmailQuerySchema = z.object({
  token: z.string().min(32, 'Link inválido'),
});

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailQuerySchema.parse(req.query);
    const found = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!found) {
      throw new AppError(
        'Link inválido ou expirado. Solicite um novo email na página «Reenviar confirmação».',
        400,
      );
    }

    await prisma.user.update({
      where: { id: found.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    res.json({
      success: true,
      message: 'Email confirmado com sucesso. Você já pode entrar.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Link inválido',
        errors: error.errors,
      });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error('verifyEmail:', error);
    res.status(500).json({ success: false, message: 'Erro ao confirmar email' });
  }
};

const promoteUserRoleSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'POLICE', 'NGO', 'USER']),
});

const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const promoteUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) throw new AppError('Usuário não autenticado', 401);
    const requester = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!requester || requester.role !== 'ADMIN') {
      throw new AppError('Apenas administradores podem alterar perfis', 403);
    }
    const { email, role } = promoteUserRoleSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) throw new AppError('Usuário não encontrado', 404);
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role },
    });
    res.json({
      success: true,
      message: `Perfil atualizado para ${role}`,
      data: { id: updated.id, email: updated.email, role: updated.role },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('promoteUserRole:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  const generic = {
    success: true,
    message:
      'Se este email estiver cadastrado e ainda não confirmado, enviamos um novo link. Verifique a caixa de entrada e o spam.',
  };
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      return res.json(generic);
    }

    const { token: verifyToken, expiresAt } = generateVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verifyToken,
        emailVerificationExpires: expiresAt,
      },
    });

    const mail = await sendSignupVerificationEmail(user.email, user.name, verifyToken);
    const devVerificationLink = !mail.sent
      ? mail.devLink ?? devVerificationLinkIfAllowed(verifyToken)
      : undefined;

    res.json({
      ...generic,
      message: mail.sent
        ? generic.message
        : mail.emailError
          ? `Não foi possível enviar: ${mail.emailError}`
          : generic.message,
      data: {
        emailDispatched: mail.sent,
        ...(mail.emailError ? { emailError: mail.emailError } : {}),
        ...(devVerificationLink ? { devVerificationLink } : {}),
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
    console.error('resendVerification:', error);
    res.status(500).json({ success: false, message: 'Erro ao processar pedido' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Schema de validação para atualização de perfil
    const updateProfileSchema = z.object({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      email: emailSchema.optional(),
      phone: z.string().optional(),
      avatarUrl: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
    });

    const validatedData = updateProfileSchema.parse(req.body);

    // Verificar se o email já existe (se estiver sendo alterado)
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: req.userId },
        },
      });

      if (existingUser) {
        throw new AppError('Email já cadastrado', 400);
      }
    }

    if (
      validatedData.avatarUrl !== undefined &&
      validatedData.avatarUrl &&
      validatedData.avatarUrl !== ''
    ) {
      const mediaCheck = await validateImageUrlForPlatform(validatedData.avatarUrl, 'avatar');
      if (!mediaCheck.ok) {
        throw new AppError(
          mediaCheck.reason || 'Imagem de perfil recusada pela validação automática',
          400,
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.avatarUrl !== undefined && {
          avatarUrl: validatedData.avatarUrl === '' ? null : validatedData.avatarUrl,
        }),
      },
      select: USER_PUBLIC_SELECT as Prisma.UserSelect,
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser,
      },
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

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
    });
  }
};
