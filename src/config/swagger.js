import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Tuk-Tuk Real-Time Tracking API",
      version: "1.0.0",
      description: `
## Sri Lanka Police — Three-Wheeler Tracking & Movement Logging System

A RESTful API for centralised, real-time tracking of registered tuk-tuks across Sri Lanka.
Supports GPS location ingestion, historical movement queries, and province/district-level
operational visibility for law enforcement.

### Authentication
All endpoints (except \`/health\` and \`/api/v1/auth/login\`) require a **Bearer JWT** in
the \`Authorization\` header.

### Role-Based Access Control (RBAC)
| Role | Scope |
|------|-------|
| \`HQ_ADMIN\` | Full system access |
| \`PROVINCIAL_ADMIN\` | Province-scoped resources |
| \`DISTRICT_OFFICER\` | District-scoped resources |
| \`STATION_OFFICER\` | Read access within assigned station |
| \`DEVICE\` | Write-only — location ping submission |
      `,
      contact: {
        name: "Sri Lanka Police IT Division",
        email: "api-support@police.lk",
      },
      license: { name: "Restricted — Government Use Only" },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production (AWS)"
            : "Development",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token obtained from POST /api/v1/auth/login",
        },
      },
      schemas: {
        // Pagination Meta
        PaginationMeta: {
          type: "object",
          properties: {
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 200 },
                totalPages: { type: "integer", example: 10 },
              },
            },
          },
        },
        // Error
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "RESOURCE_NOT_FOUND" },
                message: { type: "string", example: "Vehicle not found" },
              },
            },
          },
        },
        // Province
        Province: {
          type: "object",
          properties: {
            id: { type: "string", example: "clr1abc" },
            name: { type: "string", example: "Western Province" },
            code: { type: "string", example: "WP" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProvinceInput: {
          type: "object",
          required: ["name", "code"],
          properties: {
            name: { type: "string", example: "Western Province" },
            code: { type: "string", example: "WP", minLength: 2, maxLength: 6 },
          },
        },
        // District
        District: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Colombo" },
            code: { type: "string", example: "CMB" },
            provinceId: { type: "string" },
            province: { $ref: "#/components/schemas/Province" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        DistrictInput: {
          type: "object",
          required: ["name", "code", "provinceId"],
          properties: {
            name: { type: "string", example: "Colombo" },
            code: { type: "string", example: "CMB" },
            provinceId: { type: "string" },
          },
        },
        // Police Station
        PoliceStation: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Colombo Fort Police Station" },
            code: { type: "string", example: "CMB-FORT" },
            address: { type: "string" },
            contact: { type: "string" },
            districtId: { type: "string" },
            district: { $ref: "#/components/schemas/District" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PoliceStationInput: {
          type: "object",
          required: ["name", "code", "districtId"],
          properties: {
            name: { type: "string" },
            code: { type: "string" },
            address: { type: "string" },
            contact: { type: "string" },
            districtId: { type: "string" },
          },
        },
        //User
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string", example: "cmb.fort.01" },
            email: { type: "string", format: "email" },
            fullName: { type: "string", example: "Sgt. Nimal Perera" },
            role: {
              type: "string",
              enum: [
                "HQ_ADMIN",
                "PROVINCIAL_ADMIN",
                "DISTRICT_OFFICER",
                "STATION_OFFICER",
                "DEVICE",
              ],
            },
            isActive: { type: "boolean" },
            lastLoginAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            provinceId: { type: "string", nullable: true },
            districtId: { type: "string", nullable: true },
            policeStationId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        UserInput: {
          type: "object",
          required: ["username", "password", "email", "fullName", "role"],
          properties: {
            username: { type: "string", example: "cmb.fort.01" },
            password: { type: "string", minLength: 8, example: "Secure@123" },
            email: { type: "string", format: "email" },
            fullName: { type: "string" },
            role: {
              type: "string",
              enum: [
                "HQ_ADMIN",
                "PROVINCIAL_ADMIN",
                "DISTRICT_OFFICER",
                "STATION_OFFICER",
                "DEVICE",
              ],
            },
            provinceId: { type: "string", nullable: true },
            districtId: { type: "string", nullable: true },
            policeStationId: { type: "string", nullable: true },
          },
        },
        // Device
        Device: {
          type: "object",
          properties: {
            id: { type: "string" },
            serialNumber: { type: "string", example: "SN-TT-00123" },
            model: { type: "string", example: "GT06N" },
            firmwareVersion: { type: "string", example: "3.2.1" },
            simIccid: { type: "string", example: "89941011219002000016" },
            status: {
              type: "string",
              enum: ["UNASSIGNED", "ASSIGNED", "DECOMMISSIONED"],
            },
            vehicle: { $ref: "#/components/schemas/VehicleSummary" },
            registeredAt: { type: "string", format: "date-time" },
          },
        },
        DeviceInput: {
          type: "object",
          required: ["serialNumber"],
          properties: {
            serialNumber: { type: "string" },
            model: { type: "string" },
            firmwareVersion: { type: "string" },
            simIccid: { type: "string" },
          },
        },
        //Vehicle
        VehicleSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            registrationNumber: { type: "string", example: "WP ABC-1234" },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "string" },
            registrationNumber: { type: "string", example: "WP ABC-1234" },
            driverName: { type: "string", example: "Kamal Bandara" },
            driverNic: { type: "string", example: "198812345678V" },
            driverContact: { type: "string", example: "+94771234567" },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            },
            districtId: { type: "string" },
            district: { $ref: "#/components/schemas/District" },
            deviceId: { type: "string", nullable: true },
            device: { $ref: "#/components/schemas/Device" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        VehicleInput: {
          type: "object",
          required: [
            "registrationNumber",
            "driverName",
            "driverNic",
            "districtId",
          ],
          properties: {
            registrationNumber: { type: "string", example: "WP ABC-1234" },
            driverName: { type: "string" },
            driverNic: { type: "string" },
            driverContact: { type: "string" },
            districtId: { type: "string" },
          },
        },
        // Location Ping
        LocationPing: {
          type: "object",
          properties: {
            id: { type: "string" },
            vehicleId: { type: "string" },
            latitude: { type: "number", format: "double", example: 6.9271 },
            longitude: { type: "number", format: "double", example: 79.8612 },
            speed: { type: "number", nullable: true, example: 35.5 },
            heading: { type: "number", nullable: true, example: 270 },
            altitude: { type: "number", nullable: true },
            accuracy: { type: "number", nullable: true },
            timestamp: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        LocationPingInput: {
          type: "object",
          required: ["latitude", "longitude", "timestamp"],
          properties: {
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
              example: 6.9271,
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
              example: 79.8612,
            },
            speed: { type: "number", minimum: 0, maximum: 300 },
            heading: { type: "number", minimum: 0, maximum: 360 },
            altitude: { type: "number" },
            accuracy: { type: "number", minimum: 0 },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        // Last Known Location
        LastKnownLocation: {
          type: "object",
          properties: {
            vehicleId: { type: "string" },
            vehicle: { $ref: "#/components/schemas/VehicleSummary" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            speed: { type: "number", nullable: true },
            heading: { type: "number", nullable: true },
            timestamp: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // Auth
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", example: "hq.admin" },
            password: { type: "string", example: "Admin@1234" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                expiresIn: { type: "string", example: "15m" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid JWT token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Insufficient role permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ValidationError: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "System", description: "Health checks and API info" },
      {
        name: "Auth",
        description: "Authentication — login, token refresh, logout",
      },
      { name: "Provinces", description: "Province master data management" },
      { name: "Districts", description: "District master data management" },
      { name: "Police Stations", description: "Police station management" },
      { name: "Users", description: "Officer and device user management" },
      { name: "Devices", description: "GPS tracking device management" },
      { name: "Vehicles", description: "Tuk-tuk vehicle registry" },
      {
        name: "Location Pings",
        description: "GPS location submission and history queries",
      },
      {
        name: "Live Tracking",
        description: "Real-time last-known location view",
      },
    ],
  },
  apis: [
    join(__dirname, "../app.js"),
    join(__dirname, "../routes/*.routes.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
