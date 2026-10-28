
const request = require("supertest");
const { createApp } = require("../src/app");

describe("Apex Operations API", () => {
  test("1. Health endpoint returns 200", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("2. Readiness fails when database is not configured", async () => {
    const response = await request(createApp()).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("not_ready");
  });

  test("3. Readiness succeeds when database responds", async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }) };

    const response = await request(createApp(db)).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
    expect(db.query).toHaveBeenCalledWith("SELECT 1");
  });

  test("4. Readiness returns 503 when database fails", async () => {
    const db = { query: jest.fn().mockRejectedValue(new Error("DB unavailable")) };

    const response = await request(createApp(db)).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body.reason).toBe("database_unavailable");
  });

  test("5. Unknown endpoint returns 404", async () => {
    const response = await request(createApp()).get("/unknown");

    expect(response.status).toBe(404);
  });

  test("6. Health endpoint supports HEAD requests", async () => {
    const response = await request(createApp()).head("/health");

    expect(response.status).toBe(200);
  });
});
