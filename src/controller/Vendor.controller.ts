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
    //Update vendor

  async updateVendor(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (email) {
        const existingVendor = await VendorModel.findOne({ 
          email, 
          _id: { $ne: req.params.id } 
        });
        
        if (existingVendor) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use by another vendor'
          });
        }
      }

      const vendor = await VendorModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      logger.info(`Vendor updated: ${vendor._id}`);
      res.status(200).json({
        success: true,
        data: vendor
      });
    } catch (error) {
      logger.error('Error in updateVendor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vendor'
      });
    }
  }

  // Delete vendor

  async deleteVendor(req: Request, res: Response) {
    try {
      const vendor = await VendorModel.findByIdAndDelete(req.params.id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      logger.info(`Vendor deleted: ${req.params.id}`);
      res.status(200).json({
        success: true,
        message: 'Vendor deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteVendor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vendor'
      });
    }
  }

  //Update Vendor Stats
  
  async updateVendorStats(req: Request, res: Response) {
    try {
      const { rfpsSent, responsesReceived } = req.body;
      
      const vendor = await VendorModel.findById(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      if (rfpsSent !== undefined) vendor.rfpsSent = rfpsSent;
      if (responsesReceived !== undefined) vendor.responsesReceived = responsesReceived;

      await vendor.save(); 
      res.status(200).json({
        success: true,
        data: vendor
      });
    } catch (error) {
      logger.error('Error in updateVendorStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vendor stats'
      });
    }
}
}

export default new VendorController();