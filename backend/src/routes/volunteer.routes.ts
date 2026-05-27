import { Router } from 'express';
import {
  createVolunteer,
  getVolunteerForCase,
  getVolunteersByCase,
  getMyVolunteers,
  updateVolunteerStatus,
} from '../controllers/volunteer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createVolunteer);
router.get('/my', authenticate, getMyVolunteers);
router.get('/case/:caseId', authenticate, getVolunteersByCase);
router.get('/case/:caseId/me', authenticate, getVolunteerForCase);
router.put('/:id/status', authenticate, updateVolunteerStatus);

export default router;

