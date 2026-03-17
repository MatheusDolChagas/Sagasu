import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

// Schema de validação para registro
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
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

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user,
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
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Schema de validação para atualização de perfil
    const updateProfileSchema = z.object({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      email: z.string().email('Email inválido').optional(),
      phone: z.string().optional(),
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

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
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
