import { z } from "zod";

/** One saved array design: every control on the page. Client safe. */
export const arrayConfigSchema = z.object({
  name: z.string().trim().min(1).max(80),
  micId: z.string().min(1).max(64),
  geometry: z.string().min(1).max(32),
  n: z.number().int().min(2).max(32),
  spacingCm: z.number().min(0.5).max(100),
  tempC: z.number().min(-40).max(60),
  freqHz: z.number().min(20).max(24000),
  steerDeg: z.number().min(0).max(360),
  sourceId: z.string().min(1).max(64),
  envId: z.string().min(1).max(64),
  notes: z.string().max(2000).optional(),
});

export type ArrayConfig = z.infer<typeof arrayConfigSchema>;

export type SavedConfig = ArrayConfig & { id: string; updatedAt: string };
