import { Router } from 'express';
import emailReceiverController from '@/controller/EmailReceiver.controller';

const router = Router();

router.post('/start', emailReceiverController.startPolling);
router.post('/stop', emailReceiverController.stopPolling);
router.post('/check-now', emailReceiverController.checkNow);

export default router;