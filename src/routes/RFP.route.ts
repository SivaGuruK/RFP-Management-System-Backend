import { Router } from 'express';
import rfpController from '@/controller/RFP.controller';

const router = Router();

router.post('/generate-rfp', rfpController.generateRFP);
router.post('/create-rfp', rfpController.createRFP);
router.get('/',rfpController.getAllRFPs)
router.get('/:id',rfpController.getRFPById)
router.put('/:id',rfpController.updateRFP)
router.delete('/:id',rfpController.deleteRFP)
router.get('/stats/dashboard', rfpController.getDashboardStats);

export default router