import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type { AppRole } from "../types/express.js";

export function createAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export async function authenticateToken(token: string): Promise<{ userId: string; role: AppRole }> {
  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "A valid access token is required.");
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new AppError(401, "UNAUTHENTICATED", "A valid access token is required.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "A valid access token is required.");
  }

  return { userId: user.id, role: user.role };
}

export const authenticate: RequestHandler = async (request, _response, next) => {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    next(new AppError(401, "UNAUTHENTICATED", "A valid access token is required."));
    return;
  }

  try {
    request.auth = await authenticateToken(match[1]);
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRoles(...roles: AppRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
      return;
    }

    next();
  };
}
