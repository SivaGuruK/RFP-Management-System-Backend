import { Request, Response } from 'express';
import RFPModel from '@/models/RFP.model';
import ProposalModel from '@/models/Proposal.model';
import aiService from '@/services/ai.service';
import logger from '@/utils/logger';

class ComparisonController {
  //Compare proposals for an RFP using AI

  async compareProposals(req: Request, res: Response) {
    try {
      const { rfpId } = req.body;

      if (!rfpId) {
        return res.status(400).json({
          success: false,
          message: 'RFP ID is required'
        });
      }
      const rfp = await RFPModel.findById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found'
        });
      }

      const proposals = await ProposalModel.find({ rfpId })
        .populate('vendorId', 'name email phone');

      if (proposals.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No proposals found for this RFP'
        });
      }

      const comparison = await aiService.compareProposals(rfp, proposals);

      for (const scoreData of comparison.scores) {
        await ProposalModel.findByIdAndUpdate(
          scoreData.proposalId,
          {
            aiScore: scoreData.score,
            'aiAnalysis.strengths': scoreData.strengths,
            'aiAnalysis.weaknesses': scoreData.weaknesses,
            'aiAnalysis.recommendation': comparison.reasoning,
            status: 'evaluated'
          }
        );
      }

      rfp.status = 'evaluated';
      await rfp.save();

      logger.info(`Proposals compared for RFP ${rfpId}`);
      res.status(200).json({
        success: true,
        data: {
          rfp: {
            id: rfp._id,
            title: rfp.title,
            budget: rfp.budget
          },
          comparison: comparison,
          proposalsCount: proposals.length
        }
      });
    } catch (error) {
      logger.error('Error in compareProposals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare proposals'
      });
    }
  }

  // Get comparison results for an RFP

  async getComparisonResults(req: Request, res: Response) {
    try {
      const { rfpId } = req.params;

      const rfp = await RFPModel.findById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found'
        });
      }

      const proposals = await ProposalModel.find({ rfpId })
        .populate('vendorId', 'name email phone')
        .sort({ aiScore: -1 });

      if (proposals.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No proposals found for this RFP'
        });
      }

      const topProposal = proposals[0];

      res.status(200).json({
        success: true,
        data: {
          rfp: {
            id: rfp._id,
            title: rfp.title,
            budget: rfp.budget,
            status: rfp.status
          },
          topRecommendation: {
            vendor: topProposal.vendorId,
            score: topProposal.aiScore,
            price: topProposal.price,
            deliveryTime: topProposal.deliveryTime,
            warranty: topProposal.warranty,
            recommendation: topProposal.aiAnalysis?.recommendation
          },
          proposals: proposals.map(p => ({
            id: p._id,
            vendor: p.vendorId,
            price: p.price,
            deliveryTime: p.deliveryTime,
            warranty: p.warranty,
            score: p.aiScore,
            strengths: p.aiAnalysis?.strengths || [],
            weaknesses: p.aiAnalysis?.weaknesses || [],
            status: p.status,
            receivedDate: p.receivedDate
          }))
        }
      });
    } catch (error) {
      logger.error('Error in getComparisonResults:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comparison results'
      });
    }
  }
}

export default new ComparisonController();