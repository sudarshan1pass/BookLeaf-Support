import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import * as adminService from "./admin.service.js";
import {
  adminMessageSchema,
  internalNoteSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "./admin.schemas.js";

function routeParam(value: string | string[] | undefined, name: string) {
  const param = Array.isArray(value) ? value[0] : value;
  if (!param) throw new AppError(400, "INVALID_PARAMETER", `The ${name} parameter is required.`);
  return param;
}

export const listAuthors = asyncHandler(async (_request: Request, response: Response) => {
  const authors = await adminService.listAuthors();
  response.status(200).json({ data: { authors } });
});

export const getAuthor = asyncHandler(async (request: Request, response: Response) => {
  const author = await adminService.getAuthor(routeParam(request.params.authorId, "authorId"));
  if (!author) throw new AppError(404, "AUTHOR_NOT_FOUND", "The author was not found.");
  response.status(200).json({ data: { author } });
});

export const listBooks = asyncHandler(async (_request: Request, response: Response) => {
  const books = await adminService.listBooks();
  response.status(200).json({ data: { books } });
});

export const getBook = asyncHandler(async (request: Request, response: Response) => {
  const book = await adminService.getBook(routeParam(request.params.bookId, "bookId"));
  response.status(200).json({ data: { book } });
});

export const listTickets = asyncHandler(async (_request: Request, response: Response) => {
  const tickets = await adminService.listTickets();
  response.status(200).json({ data: { tickets } });
});

export const listTicketQueue = asyncHandler(async (request: Request, response: Response) => {
  const result = listTicketsQuerySchema.safeParse(request.query);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "The ticket filters are invalid.", result.error.issues);
  }
  const data = await adminService.listTicketQueue(result.data);
  response.status(200).json({ data });
});

export const getTicket = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await adminService.getTicket(routeParam(request.params.ticketId, "ticketId"));
  response.status(200).json({ data: { ticket } });
});

export const updateTicket = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await adminService.updateTicket(
    routeParam(request.params.ticketId, "ticketId"),
    request.body,
  );
  response.status(200).json({ data: { ticket } });
});

export const assignTicketToSelf = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await adminService.assignTicketToAdmin(
    routeParam(request.params.ticketId, "ticketId"),
    request.auth!.userId,
  );
  response.status(200).json({ data: { ticket } });
});

export const createInternalNote = asyncHandler(async (request: Request, response: Response) => {
  const note = await adminService.addInternalNote(
    routeParam(request.params.ticketId, "ticketId"),
    request.auth!.userId,
    request.body.body,
  );
  response.status(201).json({ data: { note } });
});

export const sendAdminMessage = asyncHandler(async (request: Request, response: Response) => {
  const ticket = await adminService.sendAdminMessage(
    routeParam(request.params.ticketId, "ticketId"),
    request.auth!.userId,
    request.body.message,
  );
  response.status(201).json({ data: { ticket } });
});

export const createResponseDraft = asyncHandler(async (request: Request, response: Response) => {
  const result = await adminService.createResponseDraft(routeParam(request.params.ticketId, "ticketId"));
  response.status(200).json({ data: result });
});

export const downloadAttachment = asyncHandler(async (request: Request, response: Response, next) => {
  const attachment = await adminService.getAttachment(
    routeParam(request.params.ticketId, "ticketId"),
    routeParam(request.params.attachmentId, "attachmentId"),
  );
  response.download(attachment.path, attachment.name, (error) => {
    if (error) next(error);
  });
});
