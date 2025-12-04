import { Document } from 'mongoose';

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