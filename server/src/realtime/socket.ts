import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
import { authenticateToken } from "../middleware/authenticate.js";

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string" || token.length === 0) {
      next(new Error("UNAUTHENTICATED"));
      return;
    }

    try {
      socket.data.auth = await authenticateToken(token);
      next();
    } catch {
      next(new Error("UNAUTHENTICATED"));
    }
  });

  return io;
}
