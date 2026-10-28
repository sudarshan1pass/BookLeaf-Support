import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5).max(200),
  message: z.string().trim().min(10).max(5000),
});

export const createMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

export const idParamSchema = z.object({
  ticketId: z.string().min(1).optional(),
  bookId: z.string().min(1).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
