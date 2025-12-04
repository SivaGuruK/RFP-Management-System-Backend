import { Router } from 'express';
import vendorController from '@/controller/Vendor.controller'
const router = Router();

router.post('/create-vendor', vendorController.createVendor);
router.get('/',vendorController.getAllVendors)
router.get('/:id',vendorController.getVendorById)
router.put('/:id',vendorController.updateVendor)
router.delete('/:id',vendorController.deleteVendor)
router.put('/:id/stats', vendorController.updateVendorStats);

export default router
