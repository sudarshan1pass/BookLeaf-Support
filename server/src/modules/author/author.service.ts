import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { getAttachmentPath, removeStoredAttachment, storeAttachment } from "../support/attachments.js";
import { triageTicket } from "../ai/ticket-triage.service.js";
import type { CreateMessageInput, CreateTicketInput } from "./author.schemas.js";

const safeAuthorSelect = { id: true, fullName: true, email: true, phone: true, city: true } as const;
const bookSummarySelect = {
  id: true,
  title: true,
  subtitle: true,
  genre: true,
  description: true,
  status: true,
  statusLabel: true,
  isbn: true,
  createdAt: true,
  updatedAt: true,
} as const;
const bookDetailSelect = {
  ...bookSummarySelect,
  publicationDate: true,
  mrp: true,
  authorRoyaltyPerCopy: true,
  totalCopiesSold: true,
  totalRoyaltyEarned: true,
  royaltyPaid: true,
  royaltyPending: true,
  lastRoyaltyPayoutDate: true,
  printPartner: true,
  availableOn: true,
} as const;
const ticketInclude = {
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
      attachments: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
    },
  },
};

function formatTicket<T extends { id: string; messages: Array<{ attachments: Array<{ id: string; originalName: string; mimeType: string; sizeBytes: number }> }> }>(ticket: T) {
  return {
    ...ticket,
    messages: ticket.messages.map((message) => ({
      ...message,
      attachments: message.attachments.map((attachment) => ({
        ...attachment,
        downloadUrl: `/api/author/tickets/${ticket.id}/attachments/${attachment.id}`,
      })),
    })),
  };
}

export async function getDashboard(authorId: string) {
  const [bookCount, ticketCount, openTicketCount, books, tickets] = await Promise.all([
    prisma.book.count({ where: { authorId } }),
    prisma.ticket.count({ where: { authorId } }),
    prisma.ticket.count({ where: { authorId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_AUTHOR"] } } }),
    prisma.book.findMany({ where: { authorId }, select: bookSummarySelect, orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.ticket.findMany({
      where: { authorId },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true },
        },
      },
    }),
  ]);

  return { counts: { books: bookCount, tickets: ticketCount, openTickets: openTicketCount }, recentBooks: books, recentTickets: tickets };
}

export function listBooks(authorId: string) {
  return prisma.book.findMany({ where: { authorId }, select: bookSummarySelect, orderBy: { updatedAt: "desc" } });
}

export async function getBook(authorId: string, bookId: string) {
  const book = await prisma.book.findFirst({ where: { id: bookId, authorId }, select: bookDetailSelect });
  if (!book) throw new AppError(404, "BOOK_NOT_FOUND", "The book was not found.");
  return book;
}

export function listTickets(authorId: string) {
  return prisma.ticket.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
      _count: { select: { messages: true } },
    },
  });
}

export async function getTicket(authorId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, authorId }, include: ticketInclude });
  if (!ticket) throw new AppError(404, "TICKET_NOT_FOUND", "The ticket was not found.");
  return formatTicket(ticket);
}

export async function createTicket(authorId: string, input: CreateTicketInput, file?: Express.Multer.File) {
  const attachment = file ? await storeAttachment(file) : undefined;
  try {
    const triage = await triageTicket(input.subject, input.message);
    const ticket = await prisma.ticket.create({
      data: {
        authorId,
        subject: input.subject,
        ...triage,
        messages: {
          create: {
            senderId: authorId,
            body: input.message,
            ...(attachment ? { attachments: { create: attachment } } : {}),
          },
        },
      },
      include: ticketInclude,
    });
    return formatTicket(ticket);
  } catch (error) {
    if (attachment) await removeStoredAttachment(attachment.storageKey);
    throw error;
  }
}

export async function replyToTicket(authorId: string, ticketId: string, input: CreateMessageInput) {
  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId, authorId },
      data: { messages: { create: { senderId: authorId, body: input.message } } },
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

export async function getAttachment(authorId: string, ticketId: string, attachmentId: string) {
  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: attachmentId, message: { ticketId, ticket: { authorId } } },
    select: { storageKey: true, originalName: true },
  });
  if (!attachment) throw new AppError(404, "ATTACHMENT_NOT_FOUND", "The attachment was not found.");
  return { path: getAttachmentPath(attachment.storageKey), name: attachment.originalName };
}

export async function getAuthorProfile(authorId: string) {
  const user = await prisma.user.findUnique({ where: { id: authorId }, select: safeAuthorSelect });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "The account no longer exists.");
  return user;
}
