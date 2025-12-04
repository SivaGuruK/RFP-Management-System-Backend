import mongoose, { Schema } from 'mongoose';
import { IRFP } from '@/types/index';

const ItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  specifications: { type: String, required: true }
});

const RFPSchema = new Schema<IRFP>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    items: [ItemSchema],
    deliveryTimeline: { type: String, required: true },
    paymentTerms: { type: String, required: true },
    warrantyRequired: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'sent', 'responses', 'evaluated'],
      default: 'draft'
    },
    vendorsSent: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }]
  },
  { timestamps: true }
);

export default mongoose.model<IRFP>('RFP', RFPSchema);