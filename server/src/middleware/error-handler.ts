import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import multer from "multer";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", `No route matches ${request.method} ${request.path}.`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  let appError = error instanceof AppError ? error : undefined;

  if (
    error instanceof SyntaxError &&
    "body" in error
  ) {
    appError = new AppError(400, "INVALID_JSON", "The request body must contain valid JSON.");
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    appError = new AppError(413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
  }

  if (error instanceof multer.MulterError) {
    appError = error.code === "LIMIT_FILE_SIZE"
      ? new AppError(413, "ATTACHMENT_TOO_LARGE", "Attachments must be 5 MB or smaller.")
      : new AppError(400, "INVALID_ATTACHMENT", "The attachment could not be accepted.");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      appError = new AppError(409, "CONFLICT", "A record with those details already exists.");
    } else if (error.code === "P2025") {
      appError = new AppError(404, "NOT_FOUND", "The requested record was not found.");
    } else if (["P1001", "P1002", "P1008"].includes(error.code)) {
      appError = new AppError(503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable.");
    }
  }

  const requestId = response.locals.requestId as string | undefined;

  if (!appError) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        message,
        ...(env.NODE_ENV === "development" && error instanceof Error ? { stack: error.stack } : {}),
      }),
    );
    appError = new AppError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
  }

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
    requestId,
  });
};
