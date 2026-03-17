import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const authenticateOptional = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch {
    return next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
};
