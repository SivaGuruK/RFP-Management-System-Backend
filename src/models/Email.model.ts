import mongoose, { Schema } from 'mongoose';
import { IEmail } from '@/types';

const EmailSchema = new Schema<IEmail>(
  {
    rfpId: { type: Schema.Types.ObjectId, ref: 'RFP'},
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    attachments: [{ type: String }],
    direction: { 
      type: String, 
      enum: ['inbound', 'outbound'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['sent', 'received', 'parsed', 'failed'],
      default: 'sent'
    },
    parsedProposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    receivedAt: { type: Date },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

EmailSchema.index({ rfpId: 1, direction: 1 });
EmailSchema.index({ vendorId: 1 });
EmailSchema.index({ status: 1 });

export default mongoose.model<IEmail>('Email', EmailSchema);