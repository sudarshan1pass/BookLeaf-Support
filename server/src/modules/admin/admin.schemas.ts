import { z } from "zod";

export const ticketStatuses = ["OPEN", "IN_PROGRESS", "WAITING_ON_AUTHOR", "RESOLVED", "CLOSED"] as const;
export const ticketCategories = [
  "ROYALTY_AND_PAYMENTS",
  "ISBN_AND_METADATA_ISSUES",
  "PRINTING_AND_QUALITY",
  "DISTRIBUTION_AND_AVAILABILITY",
  "BOOK_STATUS_AND_PRODUCTION_UPDATES",
  "GENERAL_INQUIRY",
] as const;
export const ticketPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export const listTicketsQuerySchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
  priority: z.enum(ticketPriorities).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict().refine((query) => !query.from || !query.to || query.from <= query.to, {
  message: "The from date must be on or before the to date.",
  path: ["from"],
});

export const updateTicketSchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
  priority: z.enum(ticketPriorities).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, "At least one ticket field is required.");

export const internalNoteSchema = z.object({ body: z.string().trim().min(1).max(5000) }).strict();
export const adminMessageSchema = z.object({ message: z.string().trim().min(1).max(5000) }).strict();

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
