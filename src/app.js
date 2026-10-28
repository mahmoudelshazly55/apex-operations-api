
const express = require("express");

function createApp(db = null) {
  const app = express();

  app.use(express.json());

  // Structured request logs
  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      console.log(
        JSON.stringify({
          level: "info",
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString()
        })
      );
    });

    next();
  });

  // Application health check
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok"
    });
  });

  // Application version
  app.get("/version", (req, res) => {
    res.status(200).json({
      version: process.env.APP_VERSION || "1.0.0"
    });
  });

  // Database readiness check
  app.get("/ready", async (req, res) => {
    if (!db) {
      return res.status(503).json({
        status: "not_ready",
        reason: "database_not_configured"
      });
    }

    try {
      await db.query("SELECT 1");

      return res.status(200).json({
        status: "ready",
        database: "connected"
      });
    } catch (error) {
      return res.status(503).json({
        status: "not_ready",
        reason: "database_unavailable"
      });
    }
  });

  return app;
}

module.exports = { createApp };
