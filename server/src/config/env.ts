import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:5173,https://bookleaf-support-mauve.vercel.app")
    .transform((origins) => origins.split(",").map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.url()).min(1)),
  DATABASE_URL: z
    .string()
    .startsWith("postgres", "DATABASE_URL must be a PostgreSQL connection URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.enum(["15m", "30m", "1h", "1d"]).default("15m"),
  SEED_ADMIN_NAME: z.string().trim().min(2).max(120).optional(),
  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).max(72).optional(),
  OPENAI_API_KEY: z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional()),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-4o-mini"),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30_000).default(8000),
  BOOKLEAF_KNOWLEDGE_BASE_PATH: z.string().trim().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment configuration:\n${issues}`);
}

export const env = parsed.data;
