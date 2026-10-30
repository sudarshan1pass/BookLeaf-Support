import { createServer } from "node:http";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { createSocketServer } from "./realtime/socket.js";

const httpServer = createServer(app);
const io = createSocketServer(httpServer);
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

httpServer.listen(port, host, () => {
  console.info(`BookLeaf API listening on ${host}:${port}.`);
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
