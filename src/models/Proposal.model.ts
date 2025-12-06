import { Schema, model } from 'mongoose';
import { IProposal } from '@/types/index';

const ProposalSchema = new Schema<IProposal>(
  {
    rfpId: { type: Schema.Types.ObjectId, ref: 'RFP', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    price: { type: Number, required: false },
    deliveryTime: { type: String, required: false },
    warranty: { type: String, required: false },
    terms: { type: String, required: false },
    parsedData: { type: Schema.Types.Mixed, required: false },
    aiScore: { type: Number, required: false },
    aiAnalysis: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendation: { type: String }
    },
    status: {
      type: String,
      enum: ['received', 'parsed', 'evaluated'],
      default: 'received'
    },
    receivedDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default model<IProposal>('Proposal', ProposalSchema);
