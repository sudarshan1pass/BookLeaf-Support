import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createSocketServer } from "./realtime/socket.js";

const npmLifecycleEvent = process.env.npm_lifecycle_event;
if (npmLifecycleEvent !== "start" && npmLifecycleEvent !== "dev" && env.NODE_ENV !== "test") {
  const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  console.info("Applying pending database migrations before API startup.");
  execFileSync(npmCommand, ["run", "db:deploy"], { cwd: serverRoot, stdio: "inherit" });
}

const httpServer = createServer(app);
const io = createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.info(`BookLeaf API listening on port ${env.PORT} (${env.NODE_ENV}).`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Received ${signal}; shutting down.`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  io.close(() => {
    void prisma
      .$disconnect()
      .catch((error: unknown) => {
        console.error("Failed to close the database connection cleanly.", error);
        process.exitCode = 1;
      })
      .finally(() => {
        clearTimeout(forceExit);
        process.exit();
      });
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
