import { Request, Response } from 'express';
import emailReceiverService from '@/services/email-receiver.service';
import logger from '@/utils/logger';

class EmailReceiverController {
  // Start email polling
  async startPolling(req: Request, res: Response) {
    try {
      const { intervalSeconds = 30 } = req.body;
      
      emailReceiverService.connect();
      emailReceiverService.startPolling(intervalSeconds * 1000);
      
      logger.info(`Email polling started with ${intervalSeconds}s interval`);
      res.status(200).json({
        success: true,
        message: `Email polling started (checking every ${intervalSeconds} seconds)`
      });
    } catch (error) {
      logger.error('Error starting email polling:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start email polling'
      });
    }
  }

  //Stop email polling
  async stopPolling(req: Request, res: Response) {
    try {
      emailReceiverService.stopPolling();
      emailReceiverService.disconnect();
      
      logger.info('Email polling stopped');
      res.status(200).json({
        success: true,
        message: 'Email polling stopped'
      });
    } catch (error) {
      logger.error('Error stopping email polling:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop email polling'
      });
    }
  }

  // Manual check for new emails
  async checkNow(req: Request, res: Response) {
    try {
      await emailReceiverService.checkNow();
      
      res.status(200).json({
        success: true,
        message: 'Email check initiated'
      });
    } catch (error) {
      logger.error('Error checking emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check emails'
      });
    }
  }
}

export default new EmailReceiverController();