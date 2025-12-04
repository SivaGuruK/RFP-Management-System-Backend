import { Request, Response } from 'express';
import aiService from '@/services/ai.service';
import logger from '@/utils/logger';

class RFPController {
  async generateRFP(req: Request, res: Response) {
    try {
      const { description } = req.body;

      if (!description) {
        return res.status(400).json({ 
          success: false, 
          message: 'Description is required' 
        });
      }

      const generatedRFP = await aiService.generateRFP(description);

      res.status(200).json({
        success: true,
        data: {
          ...generatedRFP,
          description
        }
      });
    } catch (error) {
      logger.error('Error in generateRFP:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate RFP' 
      });
    }
  }
}

export default new RFPController();