import { Router } from 'express';
import { createTip, getTipsByCase } from '../controllers/tip.controller';
import { authenticateOptional } from '../middleware/auth.middleware';

const router = Router();

router.get('/case/:caseId', getTipsByCase);
router.post('/case/:caseId', authenticateOptional, createTip);

export default router;

