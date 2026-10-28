import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { AppError } from "./errors/app-error.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { authorRouter } from "./modules/author/author.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.CLIENT_ORIGIN) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "CORS_ORIGIN_FORBIDDEN", "This origin is not allowed."));
    },
    credentials: true,
  }),
);
app.use(requestId);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ data: { status: "ok" }, requestId: response.locals.requestId });
});

app.use("/api/auth", authRouter);
app.use("/api/author", authorRouter);
app.use("/api/admin", adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);
