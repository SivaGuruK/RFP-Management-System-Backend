import mongoose from "mongoose";
import { env } from "@/config/db";
import logger from '@/utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: "RFP_MANAGEMENT",
      autoIndex: false,
    });

    logger.info("MongoDB Connected Successfully");
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};
