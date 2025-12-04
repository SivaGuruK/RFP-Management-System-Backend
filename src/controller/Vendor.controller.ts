import { Request, Response } from 'express';
import VendorModel from '@/models/Vendor.model';
import logger from '@/utils/logger';

class VendorController {
   
 // Create a new vendor

  async createVendor(req: Request, res: Response) {
    try {
      const { name, email, phone, contactPerson } = req.body;

      const existingVendor = await VendorModel.findOne({ email });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor with this email already exists'
        });
      }

      const vendor = new VendorModel({
        name,
        email,
        phone,
        contactPerson
      });

      await vendor.save();

      logger.info(`Vendor created: ${vendor._id}`);
      res.status(201).json({
        success: true,
        data: vendor
      });
    } catch (error) {
      logger.error('Error in createVendor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vendor'
      });
    }
  }
}

export default new VendorController();