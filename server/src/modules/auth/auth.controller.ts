import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.register(request.body);
  response.status(201).json({ data: result });
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body);
  response.status(200).json({ data: result });
});

export const loginAuthor = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.loginAuthor(request.body);
  response.status(200).json({ data: result });
});

export const loginAdmin = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.loginAdmin(request.body);
  response.status(200).json({ data: result });
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  const user = await authService.getCurrentUser(request.auth!.userId);
  response.status(200).json({ data: { user } });
});
