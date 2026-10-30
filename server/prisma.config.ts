import { config as loadDotEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const isRenderRuntime = process.env.RENDER === "true";

// Prisma CLI uses process.env directly in production. Only local commands load
// server/.env, preserving Docker PostgreSQL for development.
if (!isRenderRuntime && process.env.NODE_ENV !== "production") loadDotEnv();
const isProductionRuntime = isRenderRuntime || process.env.NODE_ENV === "production";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set it in the service environment or local server/.env.");
}

if (isProductionRuntime) {
  let databaseHost = "";
  try {
    databaseHost = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    // Prisma will report malformed PostgreSQL URLs without logging the value.
  }

  if (["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
    throw new Error("DATABASE_URL points to localhost in production. Configure the PostgreSQL service URL in Render.");
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
