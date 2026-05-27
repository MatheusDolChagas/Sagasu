import { Router } from 'express';
import {
  validateMedia,
  attachCaseMedia,
  promoteSightingToCaseMedia,
} from '../controllers/media.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/validate', authenticate, validateMedia);
router.post('/case/:caseId/attachments', authenticate, attachCaseMedia);
router.post('/case/:caseId/from-sighting', authenticate, promoteSightingToCaseMedia);

export default router;
