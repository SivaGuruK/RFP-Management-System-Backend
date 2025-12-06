import cron from "node-cron";
import emailReceiverService from "@/services/email-receiver.service";
import logger from "@/utils/logger";

class EmailCron {
  private isRunning = false;

  init() {
    logger.info("Email Cron: Initializing...");

    // Connect once
    emailReceiverService.connect();

    // Cron job – runs every 60 seconds
    cron.schedule("*/60 * * * * *", async () => {
      if (this.isRunning) {
        logger.warn("Email Cron: Previous job still running. Skipping...");
        return;
      }

      this.isRunning = true;

      try {
        logger.info("Email Cron: Checking for new emails...");
        await emailReceiverService.checkNow();
      } catch (err) {
        logger.error("Email Cron Error:", err);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info("Email Cron: Started (runs every 30 seconds)");
  }

  stop() {
    logger.info("Email Cron: Stopping...");
    emailReceiverService.disconnect();
  }
}

export default new EmailCron();
