import { Router } from 'express';
import vendorController from '@/controller/Vendor.controller'
const router = Router();

router.post('/create-vendor', vendorController.createVendor);

export default router
