import { Router } from 'express';
import {
  register,
  login,
  updateProfile,
  verifyEmail,
  resendVerification,
  promoteUserRole,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.put('/profile', authenticate, updateProfile);
router.post('/users/promote-role', authenticate, authorize('ADMIN'), promoteUserRole);

export default router;
