import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: "info", 
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: json(),
    }),

    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      format: json(),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    })
  );
}

export default logger;
