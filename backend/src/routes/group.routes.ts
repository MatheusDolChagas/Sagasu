import { Router } from 'express';
import {
  createGroup,
  getGroupsByCase,
  getMyGroups,
  joinGroup,
  leaveGroup,
  updateGroup,
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, getMyGroups);
router.get('/case/:caseId', authenticate, getGroupsByCase);
router.post('/', authenticate, createGroup);
router.post('/:groupId/join', authenticate, joinGroup);
router.post('/:groupId/leave', authenticate, leaveGroup);
router.put('/:id', authenticate, updateGroup);

export default router;
