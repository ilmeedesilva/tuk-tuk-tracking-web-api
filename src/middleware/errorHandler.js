import logger from "../utils/logger.js";

const ERROR_CODES = {
  P2002: "DUPLICATE_ENTRY",
  P2003: "FOREIGN_KEY_VIOLATION",
  P2025: "RESOURCE_NOT_FOUND",
  P2016: "QUERY_ERROR",
  s,
};

//Global error-handling middleware
export const errorHandler = (err, req, res, _next) => {
  // Default values
  let status = err.status || err.statusCode || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred";

  // Prisma errors
  if (err.constructor?.name?.startsWith("Prisma")) {
    if (err.code === "P2002") {
      status = 409;
      code = "DUPLICATE_ENTRY";
      const field = err.meta?.target?.join(", ") || "field";
      message = `A record with that ${field} already exists`;
    } else if (err.code === "P2025") {
      status = 404;
      code = "RESOURCE_NOT_FOUND";
      message = err.meta?.cause || "Record not found";
    } else if (err.code === "P2003") {
      status = 400;
      code = "INVALID_REFERENCE";
      message = `Referenced ${err.meta?.field_name || "record"} does not exist`;
    } else {
      status = 500;
      code = ERROR_CODES[err.code] || "DATABASE_ERROR";
      message = "A database error occurred";
    }
  }

  //JWT errors
  if (err.name === "JsonWebTokenError") {
    status = 401;
    code = "INVALID_TOKEN";
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    status = 401;
    code = "TOKEN_EXPIRED";
    message = "Authentication token has expired";
  }

  //Validation errors
  if (err.name === "ValidationError" || code === "VALIDATION_ERROR") {
    status = 422;
  }

  // server errors
  if (status >= 500) {
    logger.error("Unhandled error", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status,
      error: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn("Client error", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status,
      code,
    });
  }

  res.status(status).json({
    success: false,
    error: { code, message },
    ...(req.requestId && { requestId: req.requestId }),
  });
};

//404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
};

//HTTP errors.
export const createError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};
