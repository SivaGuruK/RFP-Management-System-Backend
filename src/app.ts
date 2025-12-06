import express, { Express } from "express";
import RFPRoutes from "@/routes/RFP.route"
import VendorRoutes from "@/routes/Vendor.route"
import EmailRoutes from "@/routes/Email.route"
import ComparisonRoutes from "@/routes/Comparison.route"
import emailReceiverRoutes from '@/routes/EmailReceiver.route';
import emailReceiverService from '@/services/email-receiver.service';
import cors from "cors";

const app: Express = express();

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
}));

// Start email polling automatically when server starts
process.on('SIGINT', () => {
  console.log('Shutting down...');
  emailReceiverService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  emailReceiverService.disconnect();
  process.exit(0);
});


app.use('/api/v1/rfps', RFPRoutes);
app.use('/api/v1/vendors',VendorRoutes)
app.use('/api/v1/emails',EmailRoutes)
app.use('/api/v1/compare',ComparisonRoutes)
app.use('/api/v1/email-receiver', emailReceiverRoutes);


export default app