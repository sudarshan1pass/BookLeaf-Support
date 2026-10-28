import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { getAttachmentPath } from "../support/attachments.js";
import { generateResponseDraft } from "../ai/response.service.js";
import type { ListTicketsQuery, UpdateTicketInput } from "./admin.schemas.js";

const authorSelect = { id: true, fullName: true, email: true, phone: true, city: true, createdAt: true } as const;
const bookInclude = { author: { select: authorSelect } };
const ticketInclude = {
  author: { select: authorSelect },
  assignedAdmin: { select: authorSelect },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
      attachments: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
    },
  },
  internalNotes: {
    orderBy: { createdAt: "asc" as const },
    include: { admin: { select: { id: true, fullName: true, email: true } } },
  },
};

function formatTicket<T extends { id: string; messages: Array<{ attachments: Array<{ id: string; originalName: string; mimeType: string; sizeBytes: number }> }> }>(ticket: T) {
  return {
    ...ticket,
    messages: ticket.messages.map((message) => ({
      ...message,
      attachments: message.attachments.map((attachment) => ({
        ...attachment,
        downloadUrl: `/api/admin/tickets/${ticket.id}/attachments/${attachment.id}`,
      })),
    })),
  };
}

export async function listAuthors() {
  return prisma.user.findMany({ where: { role: "AUTHOR" }, select: authorSelect, orderBy: { createdAt: "desc" } });
}

export function getAuthor(authorId: string) {
  return prisma.user.findFirst({ where: { id: authorId, role: "AUTHOR" }, select: authorSelect });
}

export function listBooks() {
  return prisma.book.findMany({ include: bookInclude, orderBy: { updatedAt: "desc" } });
}

export async function getBook(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, include: bookInclude });
  if (!book) throw new AppError(404, "BOOK_NOT_FOUND", "The book was not found.");
  return book;
}

export async function listTickets() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: authorSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
      _count: { select: { messages: true } },
    },
  });
  return tickets;
}

export async function listTicketQueue(query: ListTicketsQuery) {
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;
  if (query.priority) where.priority = query.priority;
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.gte = new Date(query.from + "T00:00:00.000Z");
    if (query.to) {
      const toExclusive = new Date(query.to + "T00:00:00.000Z");
      toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
      createdAt.lt = toExclusive;
    }
    where.createdAt = createdAt;
  }
  const skip = (query.page - 1) * query.pageSize;
  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: {
        author: { select: authorSelect },
        assignedAdmin: { select: authorSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);
  return { tickets, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } };
}

export async function updateTicket(ticketId: string, input: UpdateTicketInput) {
  try {
    return await prisma.ticket.update({ where: { id: ticketId }, data: input, include: ticketInclude });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
    }
    throw error;
  }
}

export async function assignTicketToAdmin(ticketId: string, adminId: string) {
  try {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedAdminId: adminId },
      include: ticketInclude,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
    }
    throw error;
  }
}

export async function addInternalNote(ticketId: string, adminId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
  if (!ticket) throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
  return prisma.ticketInternalNote.create({
    data: { ticketId, adminId, body },
    include: { admin: { select: authorSelect } },
  });
}

export async function sendAdminMessage(ticketId: string, adminId: string, message: string) {
  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { messages: { create: { senderId: adminId, body: message } } },
      include: ticketInclude,
    });
    return formatTicket(updated);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
    }
    throw error;
  }
}

export async function createResponseDraft(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      subject: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { body: true, sender: { select: { role: true } } },
      },
    },
  });
  if (!ticket) throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
  const messages = ticket.messages.reverse().map((message) => ({
    role: message.sender.role === "AUTHOR" ? "author" as const : "support" as const,
    body: message.body,
  }));
  return generateResponseDraft({ subject: ticket.subject, messages });
}

export async function getTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: ticketInclude });
  if (!ticket) throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
  return formatTicket(ticket);
}

export async function getAttachment(ticketId: string, attachmentId: string) {
  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: attachmentId, message: { ticketId } },
    select: { storageKey: true, originalName: true },
  });
  if (!attachment) throw new AppError(404, "ATTACHMENT_NOT_FOUND", "The attachment was not found.");
  return { path: getAttachmentPath(attachment.storageKey), name: attachment.originalName };
}
