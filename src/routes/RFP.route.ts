import { Router } from 'express';
import rfpController from '@/controller/RFP.controller';

const router = Router();

router.post('/generate-rfp', rfpController.generateRFP);

export default router