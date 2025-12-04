import { Router } from 'express';
import rfpController from '@/controller/RFP.controller';

const router = Router();

router.post('/generate-rfp', rfpController.generateRFP);
router.post('/create-rfp', rfpController.createRFP);

export default router