import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client = null;
let collection = null;

/** Connect once at boot. Exits the process on failure (see server.js). */
export async function connectDb() {
  client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  collection = client.db(env.dbName).collection(env.collectionName);
  console.log(`[db] Connected — ${env.dbName}.${env.collectionName}`);
}

/** The news collection. Throws if called before connectDb() resolves. */
export function getCollection() {
  if (!collection) {
    throw new Error("Database is not connected yet.");
  }
  return collection;
}

/** Close the connection cleanly (Ctrl+C / deploy shutdowns). */
export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    collection = null;
  }
}
