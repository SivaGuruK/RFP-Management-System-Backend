import { Router } from 'express';
import comparisonController from '../controller/Comparison.controller';

const router = Router();

router.post('/analyze', comparisonController.compareProposals);
router.get('/rfp/:rfpId', comparisonController.getComparisonResults);

export default router;