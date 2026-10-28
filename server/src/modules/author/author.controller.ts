import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { AppError } from "../../errors/app-error.js";
import * as authorService from "./author.service.js";

function routeParam(value: string | string[] | undefined, name: string) {
  const param = Array.isArray(value) ? value[0] : value;
  if (!param) throw new AppError(400, "INVALID_PARAMETER", `The ${name} parameter is required.`);
  return param;
}

export const dashboard = asyncHandler(async (request: Request, response: Response) => {
  const data = await authorService.getDashboard(request.auth!.userId);
  response.status(200).json({ data });
});

export const profile = asyncHandler(async (request: Request, response: Response) => {
  const user = await authorService.getAuthorProfile(request.auth!.userId);
  response.status(200).json({ data: { user } });
});

export const listBooks = asyncHandler(async (request: Request, response: Response) => {
  const books = await authorService.listBooks(request.auth!.userId);
  response.status(200).json({ data: { books } });
});

export const getBook = asyncHandler(async (request: Request, response: Response) => {
  const book = await authorService.getBook(request.auth!.userId, routeParam(request.params.bookId, "bookId"));
  response.status(200).json({ data: { book } });
});

export const listTickets = asyncHandler(async (request: Request, response: Response) => {
  const tickets = await authorService.listTickets(request.auth!.userId);
  response.status(200).json({ data: { tickets } });
});

export const getTicket = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await authorService.getTicket(request.auth!.userId, routeParam(request.params.ticketId, "ticketId"));
  response.status(200).json({ data: { ticket } });
});

export const createTicket = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await authorService.createTicket(request.auth!.userId, request.body, request.file);
  response.status(201).json({ data: { ticket } });
});

export const replyToTicket = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await authorService.replyToTicket(request.auth!.userId, routeParam(request.params.ticketId, "ticketId"), request.body);
  response.status(201).json({ data: { ticket } });
});

export const downloadAttachment = asyncHandler(async (request: Request, response: Response, next) => {
  const attachment = await authorService.getAttachment(
    request.auth!.userId,
    routeParam(request.params.ticketId, "ticketId"),
    routeParam(request.params.attachmentId, "attachmentId"),
  );
  response.download(attachment.path, attachment.name, (error) => {
    if (error) next(error);
  });
});
