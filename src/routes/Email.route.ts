import { Router } from 'express';
import emailController from '@/controller/Email.controller';

const router = Router();

router.post('/send-rfp', emailController.sendRFPToVendors);
router.get('/', emailController.getAllEmails);
router.get('/rfp/:rfpId', emailController.getEmailsByRFP);
router.get('/:id', emailController.getEmailById);

export default router;