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


  // Get all vendors

  async getAllVendors(req: Request, res: Response) {
    try {
      const { search } = req.query;
      
      let filter: any = {};
      if (search) {
        filter = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }

      const vendors = await VendorModel.find(filter).sort({ name: 1 });

      res.status(200).json({
        success: true,
        count: vendors.length,
        data: vendors
      });
    } catch (error) {
      logger.error('Error in getAllVendors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vendors'
      });
    }
  }


  // Get vendor by ID
  
  async getVendorById(req: Request, res: Response) {
    try {
      const vendor = await VendorModel.findById(req.params.id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.status(200).json({
        success: true,
        data: vendor
      });
    } catch (error) {
      logger.error('Error in getVendorById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vendor'
      });
    }
  }

}

export default new VendorController();