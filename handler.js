import "dotenv/config";
import serverlessHttp from "serverless-http";
import app from "./src/app.js";
import { prisma } from "./src/config/database.js";
import logger from "./src/utils/logger.js";

// AWS Lambda handler

const serverlessHandler = serverlessHttp(app, {
  request: (request, event) => {
    request.lambdaEvent = event;
  },
});

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await prisma.$connect();
  } catch (err) {
    logger.error("DB connection error in Lambda handler:", err);
  }

  return serverlessHandler(event, context);
};
