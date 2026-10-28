import { defineConfig } from "vitest/config";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://bookleaf:test@localhost:5432/bookleaf_test?schema=public";
process.env.JWT_SECRET ??= "vitest-only-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.CLIENT_ORIGIN ??= "http://localhost:5173";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
  },
});
