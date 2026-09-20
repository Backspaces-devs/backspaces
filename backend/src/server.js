import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb, closeDb } from "./config/db.js";

async function start() {
  try {
    await connectDb();
  } catch (err) {
    console.error("[server] Could not connect to MongoDB:", err.message);
    console.error("[server] Check MONGODB_URI in your .env (and network/VPN), then restart.");
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`[server] News API running → http://localhost:${env.port}`);
    console.log(`[server] Health check     → http://localhost:${env.port}/health`);
    console.log(`[server] News feed        → http://localhost:${env.port}/api/news`);
  });
}

// Clean shutdown on Ctrl+C (and deploy stop signals).
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    console.log(`[server] ${signal} received — closing MongoDB connection...`);
    await closeDb();
    process.exit(0);
  });
}

start();
