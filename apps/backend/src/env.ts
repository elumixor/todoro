import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_AUTH_TOKEN: z.string().min(1),
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
  })
  .transform((e) => ({
    ...e,
    production: e.NODE_ENV === "production",
    development: e.NODE_ENV === "development",
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
