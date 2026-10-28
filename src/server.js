
const { Pool } = require("pg");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "apex",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "apex_operations",
  connectionTimeoutMillis: 3000
});

const app = createApp(pool);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(JSON.stringify({
    level: "info",
    message: "API server started",
    port: PORT,
    timestamp: new Date().toISOString()
  }));
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
