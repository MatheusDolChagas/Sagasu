import { Router } from 'express';
import {
  createGroup,
  getGroupsByCase,
  getMyGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
  updateGroup,
  getGroupById,
  createGroupComment,
  markGroupMessagesRead,
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, getMyGroups);
router.get('/case/:caseId', authenticate, getGroupsByCase);
router.get('/:id', authenticate, getGroupById);
router.post('/:id/comments', authenticate, createGroupComment);
router.post('/:id/read', authenticate, markGroupMessagesRead);
router.post('/', authenticate, createGroup);
router.post('/:groupId/join', authenticate, joinGroup);
router.post('/:groupId/leave', authenticate, leaveGroup);
router.put('/:id', authenticate, updateGroup);
router.delete('/:id', authenticate, deleteGroup);

export default router;
