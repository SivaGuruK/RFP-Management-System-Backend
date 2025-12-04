import express, { Express } from "express";
import RFProutes from "@/routes/RFP.route"

const app: Express = express();

app.use(express.json());

app.use('/api/v1/rfp', RFProutes);

export default app