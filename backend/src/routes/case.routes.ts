import { Router } from 'express';
import { createCase, getCases, getCaseById, getMyCases } from '../controllers/case.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rotas públicas
router.get('/', getCases);
router.get('/:id', getCaseById);

// Rotas protegidas
router.post('/', authenticate, createCase);
router.get('/my/list', authenticate, getMyCases);

export default router;
