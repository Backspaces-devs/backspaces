import dotenv from "dotenv";

dotenv.config();

// Fail fast with a clear message instead of crashing mid-request later.
for (const key of ["MONGODB_URI"]) {
  if (!process.env[key]) {
    console.error(`[env] Missing required env var: ${key}`);
    console.error("[env] Copy .env.example to .env and fill in your values, then restart.");
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT || "8000", 10),
  mongoUri: process.env.MONGODB_URI,
  // Defaults match the news engine (microservices/news_engine) — override in .env if you changed them there.
  dbName: process.env.MONGO_DB_NAME || "News",
  collectionName: process.env.MONGO_COLLECTION_NAME || "releventNews",
  // Where the frontend runs — direct fetches from these origins are allowed (CORS).
  corsOrigins: (process.env.CORS_ORIGINS ||
    "http://localhost:3000,https://backspaces-one.vercel.app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
