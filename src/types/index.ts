import { Document } from 'mongoose';
import { Types } from "mongoose";

export interface IItem {
  name: string;
  quantity: number;
  specifications: string;
}

export interface IRFP extends Document {
  title: string;
  description: string;
  budget: number;
  items: IItem[];
  deliveryTimeline: string;
  paymentTerms: string;
  warrantyRequired: string;
  status: 'draft' | 'sent' | 'responses' | 'evaluated';
  vendorsSent: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendor extends Document {
  name: string;
  email: string;
  phone: string;
  contactPerson?: string;
  rfpsSent: number;
  responsesReceived: number;
  responseRate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmail extends Document {
  rfpId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'received' | 'parsed' | 'failed';
  parsedProposalId?: string;
  receivedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}