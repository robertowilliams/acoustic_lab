import { MongoClient, type Collection } from "mongodb";
import type { ArrayConfig } from "./config-schema";

/**
 * Server only MongoDB access for saved array configurations.
 *
 * The connection string comes from MONGODB_URI (set it in `.env`, which is
 * gitignored). Database and collection default to `acoustic_lab` / `config`
 * and can be overridden with MONGODB_DB and MONGODB_COLLECTION.
 *
 * Note: never use a database literally named `config`. That is a reserved
 * MongoDB system database and Atlas rejects writes to it.
 */

type ConfigDoc = ArrayConfig & { createdAt: Date; updatedAt: Date };

type Cache = { client?: MongoClient; ready?: Promise<Collection<ConfigDoc>> };
const g = globalThis as typeof globalThis & { __acousticLabMongo?: Cache };
const cache: Cache = (g.__acousticLabMongo ??= {});

function loadDotEnvOnce() {
  if (process.env.MONGODB_URI) return;
  try {
    // Node 20.12+ / 22: read .env from the project root without extra deps.
    (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(".env");
  } catch {
    /* no .env file, fall through */
  }
}

export function mongoConfigured(): boolean {
  loadDotEnvOnce();
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function configCollection(): Promise<Collection<ConfigDoc>> {
  if (cache.ready) return cache.ready;
  loadDotEnvOnce();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env in the project root.");

  cache.ready = (async () => {
    const client = new MongoClient(uri, {
      appName: "acoustic-lab",
      serverSelectionTimeoutMS: 8000,
    });
    await client.connect();
    cache.client = client;
    const db = client.db(process.env.MONGODB_DB?.trim() || "acoustic_lab");
    const col = db.collection<ConfigDoc>(process.env.MONGODB_COLLECTION?.trim() || "config");
    await col.createIndex({ name: 1 }, { unique: true });
    return col;
  })();

  try {
    return await cache.ready;
  } catch (err) {
    cache.ready = undefined; // allow a retry on the next request
    throw err;
  }
}
