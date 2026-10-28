import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from "../../config/constants.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate-body.js";
import * as authController from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Try again later." },
      requestId: response.locals.requestId,
    });
  },
});

authRouter.post("/register", authRateLimit, validateBody(registerSchema), authController.register);
authRouter.post("/login", authRateLimit, validateBody(loginSchema), authController.login);
authRouter.post("/author/login", authRateLimit, validateBody(loginSchema), authController.loginAuthor);
authRouter.post("/admin/login", authRateLimit, validateBody(loginSchema), authController.loginAdmin);
authRouter.get("/me", authenticate, authController.me);
