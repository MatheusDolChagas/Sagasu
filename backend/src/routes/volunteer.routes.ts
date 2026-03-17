import { Router } from 'express';
import {
  createVolunteer,
  getVolunteerForCase,
  getVolunteersByCase,
  getMyVolunteers,
} from '../controllers/volunteer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createVolunteer);
router.get('/my', authenticate, getMyVolunteers);
router.get('/case/:caseId', authenticate, getVolunteersByCase);
router.get('/case/:caseId/me', authenticate, getVolunteerForCase);

export default router;

