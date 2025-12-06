import { Request, Response } from 'express';
import EmailModel from '@/models/Email.model';
import RFPModel from '@/models/RFP.model';
import VendorModel from '@/models/Vendor.model';
import emailService from '@/services/email.service';
import logger from '@/utils/logger';

class EmailController {
  // Send RFP to selected vendors

  async sendRFPToVendors(req: Request, res: Response) {
    try {
      const { rfpId, vendorIds } = req.body;

      if (!rfpId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'RFP ID and vendor IDs are required'
        });
      }
      const rfp = await RFPModel.findById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found'
        });
      }
      const vendors = await VendorModel.find({ _id: { $in: vendorIds } });
      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No vendors found'
        });
      }

      const results = await emailService.sendRFPToMultipleVendors(rfp, vendors);
      const emailLogs = vendors.map(vendor => ({
        rfpId: rfp._id,
        vendorId: vendor._id,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: vendor.email,
        subject: `RFP: ${rfp.title}`,
        body: `RFP sent for ${rfp.title}`,
        direction: 'outbound' as const,
        status: results.success.includes(vendor.email) ? 'sent' as const : 'failed' as const,
        sentAt: new Date()
      }));

      await EmailModel.insertMany(emailLogs);

      rfp.status = 'sent';
      rfp.vendorsSent = vendorIds;
      await rfp.save();

      for (const vendor of vendors) {
        vendor.rfpsSent += 1;
        await vendor.save();
      }

      logger.info(`RFP ${rfpId} sent to ${vendors.length} vendors`);
      res.status(200).json({
        success: true,
        message: `RFP sent to ${results.success.length} vendor(s)`,
        data: {
          sent: results.success.length,
          failed: results.failed.length,
          successEmails: results.success,
          failedEmails: results.failed
        }
      });
    } catch (error) {
      logger.error('Error in sendRFPToVendors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send RFP emails'
      });
    }
  }

  // Get all emails for an RFP

  async getEmailsByRFP(req: Request, res: Response) {
    try {
      const { rfpId } = req.params;

      const emails = await EmailModel.find({ rfpId })
        .populate('vendorId', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: emails.length,
        data: emails
      });
    } catch (error) {
      logger.error('Error in getEmailsByRFP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails'
      });
    }
  }

  //Get all emails (inbox view)

  async getAllEmails(req: Request, res: Response) {
    try {
      const { direction, status } = req.query;

      const filter: any = {};
      if (direction) filter.direction = direction;
      if (status) filter.status = status;

      const emails = await EmailModel.find(filter)
        .populate('rfpId', 'title')
        .populate('vendorId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({
        success: true,
        count: emails.length,
        data: emails
      });
    } catch (error) {
      logger.error('Error in getAllEmails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails'
      });
    }
  }

  //Get email by ID
  async getEmailById(req: Request, res: Response) {
    try {
      const email = await EmailModel.findById(req.params.id)
        .populate('rfpId', 'title')
        .populate('vendorId', 'name email')
        .populate('parsedProposalId');

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      res.status(200).json({
        success: true,
        data: email
      });
    } catch (error) {
      logger.error('Error in getEmailById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email'
      });
    }
  }
}

export default new EmailController();