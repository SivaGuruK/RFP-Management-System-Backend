import mongoose, { Schema } from 'mongoose';
import { IVendor } from '@/types';

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: { type: String, required: true },
    contactPerson: { type: String },
    rfpsSent: { type: Number, default: 0 },
    responsesReceived: { type: Number, default: 0 },
    responseRate: { type: String, default: '0%' }
  },
  { timestamps: true }
);

VendorSchema.pre('save', function(next) {
  if (this.rfpsSent > 0) {
    const rate = (this.responsesReceived / this.rfpsSent * 100).toFixed(0);
    this.responseRate = `${rate}%`;
  } else {
    this.responseRate = '0%';
  }
});

VendorSchema.index({ email: 1 });
VendorSchema.index({ name: 1 });

export default mongoose.model<IVendor>('Vendor', VendorSchema);