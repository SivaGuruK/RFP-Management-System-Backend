import express, { Express } from "express";
import RFProutes from "@/routes/RFP.route"
import Vendorroutes from "@/routes/Vendor.route"

const app: Express = express();

app.use(express.json());

app.use('/api/v1/rfps', RFProutes);
app.use('/api/v1/vendors',Vendorroutes)

export default app