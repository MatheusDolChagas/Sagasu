import { Router } from 'express';
import { submitContact, listContactInbox } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', submitContact);
router.get('/inbox', authenticate, listContactInbox);

export default router;
