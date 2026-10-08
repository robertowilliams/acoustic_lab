import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { arrayConfigSchema, type SavedConfig } from "./config-schema";

/**
 * Server functions for saved configurations. They run on the server only, so
 * the MongoDB connection string never reaches the browser.
 */

export const getConfigStoreStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ configured: boolean; ok: boolean; error?: string }> => {
    const { mongoConfigured, configCollection } = await import("./config-store.server");
    if (!mongoConfigured()) return { configured: false, ok: false };
    try {
      await configCollection();
      return { configured: true, ok: true };
    } catch (err) {
      return { configured: true, ok: false, error: (err as Error).message };
    }
  },
);

export const listConfigs = createServerFn({ method: "GET" }).handler(
  async (): Promise<SavedConfig[]> => {
    const { configCollection } = await import("./config-store.server");
    const col = await configCollection();
    const docs = await col.find({}).sort({ updatedAt: -1 }).limit(200).toArray();
    return docs.map(({ _id, createdAt: _c, updatedAt, ...rest }) => ({
      ...rest,
      id: String(_id),
      updatedAt: updatedAt.toISOString(),
    }));
  },
);

/** Insert, or overwrite the config with the same name. */
export const saveConfig = createServerFn({ method: "POST" })
  .inputValidator(arrayConfigSchema)
  .handler(async ({ data }) => {
    const { configCollection } = await import("./config-store.server");
    const col = await configCollection();
    const now = new Date();
    await col.updateOne(
      { name: data.name },
      { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    return { ok: true as const };
  });

export const deleteConfig = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { configCollection } = await import("./config-store.server");
    const col = await configCollection();
    const res = await col.deleteOne({ name: data.name });
    return { deleted: res.deletedCount };
  });
