import request from "supertest";
import app from "../src/app.js";

describe("GET /health", () => {
  it("should return 200 with service status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "healthy");
    expect(res.body).toHaveProperty("service", "tuk-tuk-tracking-api");
    expect(res.body).toHaveProperty("version");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
  });

  it("should include environment information", async () => {
    const res = await request(app).get("/health");

    expect(res.body).toHaveProperty("environment");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("GET /api/docs", () => {
  it("should serve Swagger UI", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

describe("GET /api/docs.json", () => {
  it("should return OpenAPI spec as JSON", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openapi", "3.0.3");
    expect(res.body.info).toHaveProperty(
      "title",
      "Tuk-Tuk Real-Time Tracking API",
    );
  });
});

describe("404 handling", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
