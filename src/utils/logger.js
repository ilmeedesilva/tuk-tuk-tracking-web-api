import winston from "winston";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const isDev = process.env.NODE_ENV !== "production";

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  format: isDev ? devFormat : prodFormat,
  defaultMeta: {
    service: "tuk-tuk-api",
    env: process.env.NODE_ENV || "development",
  },
  transports: [new winston.transports.Console()],
});

if (!isDev && process.env.AWS_REGION) {
  import("winston-cloudwatch")
    .then(({ default: WinstonCloudWatch }) => {
      logger.add(
        new WinstonCloudWatch({
          logGroupName: process.env.CLOUDWATCH_LOG_GROUP || "/tuk-tuk-api/prod",
          logStreamName: `api-${new Date().toISOString().split("T")[0]}`,
          awsRegion: process.env.AWS_REGION,
          jsonMessage: true,
          retentionInDays: 30,
        }),
      );
    })
    .catch(() => {
      logger.warn(
        "Failed to load winston-cloudwatch, CloudWatch logging disabled",
      );
    });
}

logger.http = (message) => logger.info(message, { type: "http" });

export default logger;
