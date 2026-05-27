import { Router } from 'express';
import {
  createCase,
  getCases,
  getCaseById,
  getCaseFeed,
  getMyCases,
  updateCase,
  exportCaseForAuthorities,
} from '../controllers/case.controller';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCases);
router.get('/my/list', authenticate, getMyCases);
router.post('/', authenticate, createCase);
router.get('/:id/feed', authenticateOptional, getCaseFeed);
router.get('/:id/export-authorities', authenticate, exportCaseForAuthorities);
router.put('/:id', authenticate, updateCase);
router.get('/:id', getCaseById);

export default router;
