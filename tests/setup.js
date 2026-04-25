import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-only";
process.env.JWT_REFRESH_SECRET =
  "test-jwt-refresh-secret-for-unit-testing-only";
process.env.LOG_LEVEL = "silent";
