import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import provinceRoutes from "./routes/province.routes.js";
import districtRoutes from "./routes/district.routes.js";
import policeStationRoutes from "./routes/policeStation.routes.js";
import userRoutes from "./routes/user.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import locationPingRoutes from "./routes/locationPing.routes.js";
import liveTrackingRoutes from "./routes/liveTracking.routes.js";

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];
app.use(
  cors({
    origin:
      allowedOrigins.length > 0 && !allowedOrigins.includes("*")
        ? allowedOrigins
        : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "If-None-Match",
    ],
    exposedHeaders: [
      "ETag",
      "X-Request-ID",
      "X-RateLimit-Remaining",
      "X-Total-Count",
    ],
    credentials: false,
    maxAge: 86400,
  }),
);

// General Middleware

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// HTTP request logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.http(message.trim()) },
    }),
  );
}

// Attach unique request ID to each request
app.use((req, _res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// Rate Limiting

app.use("/api/", globalRateLimiter);

// API Documentation (Swagger)

app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Tuk-Tuk Tracking API — Sri Lanka Police",
  }),
);

// app.get(["/api/docs", "/api/docs/"], (_req, res) => {
//   res.setHeader("Content-Type", "text/html");
//   res.send(`<!DOCTYPE html>
// <html>
//   <head>
//     <title>Tuk-Tuk Tracking API — Sri Lanka Police</title>
//     <meta charset="utf-8"/>
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//     <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
//     <style>.swagger-ui .topbar { display: none }</style>
//   </head>
//   <body>
//     <div id="swagger-ui"></div>
//     <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
//     <script>
//       window.onload = function() {
//         const base = window.location.href.replace(/\\/docs\\/?.*$/, '/docs.json');
//         SwaggerUIBundle({
//           url: base,
//           dom_id: '#swagger-ui',
//           deepLinking: true,
//           presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
//           layout: 'BaseLayout',
//         });
//       };
//     </script>
//   </body>
// </html>`);
// });

// Health Check (no auth required)

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Returns current service status, version, and uptime
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 version:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "tuk-tuk-tracking-api",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/provinces`, provinceRoutes);
app.use(`${API_PREFIX}/districts`, districtRoutes);
app.use(`${API_PREFIX}/police-stations`, policeStationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
app.use(`${API_PREFIX}/devices`, deviceRoutes);
app.use(`${API_PREFIX}/location-pings`, locationPingRoutes);
app.use(`${API_PREFIX}/live-tracking`, liveTrackingRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
