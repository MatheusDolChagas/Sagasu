import { Router } from 'express';
import { createSighting, getSightings, getSightingsByCase } from '../controllers/sighting.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getSightings);
router.get('/case/:caseId', getSightingsByCase);
router.post('/', authenticate, createSighting);

export default router;
