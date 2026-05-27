import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';
import { getOpenApiDocument } from '../docs/openapi';

const router = Router();

router.get(
  '/openapi.json',
  authenticate,
  authorize('ADMIN'),
  (_req: AuthRequest, res: Response) => {
    res.json(getOpenApiDocument());
  },
);

export default router;
