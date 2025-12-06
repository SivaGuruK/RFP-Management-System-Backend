import 'dotenv/config';
import app from '@/app';
import { connectDB } from '@/database/connect';
import logger from '@/utils/logger';
import http from "http";
import emailCron from "@/cron/emailPoller.cron";

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => logger.info(`Server running at http://localhost:${PORT}`));
});

emailCron.init();