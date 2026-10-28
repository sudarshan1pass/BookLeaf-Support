import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  book: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  ticket: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  ticketMessage: { create: vi.fn() },
  ticketInternalNote: { create: vi.fn() },
  ticketAttachment: { findFirst: vi.fn() },
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../src/modules/ai/ticket-triage.service.js", () => ({
  triageTicket: vi.fn().mockResolvedValue({ category: "GENERAL_INQUIRY", priority: "MEDIUM" }),
}));

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app.js";
import { triageTicket } from "../src/modules/ai/ticket-triage.service.js";

const passwordHash = bcrypt.hashSync("a-strong-author-password", 4);
const authors = [
  { id: "author-a", fullName: "Avery Author", email: "avery@example.test", role: "AUTHOR", createdAt: new Date("2026-01-01") },
  { id: "author-b", fullName: "Bailey Writer", email: "bailey@example.test", role: "AUTHOR", createdAt: new Date("2026-01-02") },
];
const books = [
  { id: "book-a", authorId: "author-a", title: "Avery’s Book", status: "DRAFT", createdAt: new Date(), updatedAt: new Date() },
  { id: "book-b", authorId: "author-b", title: "Bailey’s Book", status: "PUBLISHED", createdAt: new Date(), updatedAt: new Date() },
];
const tickets = [
  { id: "ticket-a", authorId: "author-a", subject: "Avery’s question", status: "OPEN", createdAt: new Date(), updatedAt: new Date(), messages: [] },
  { id: "ticket-b", authorId: "author-b", subject: "Bailey’s question", status: "RESOLVED", createdAt: new Date(), updatedAt: new Date(), messages: [] },
];

function tokenFor(userId: string) {
  return jwt.sign({}, process.env.JWT_SECRET!, { algorithm: "HS256", subject: userId, expiresIn: "15m" });
}

describe("JWT and authorization boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(triageTicket).mockResolvedValue({ category: "GENERAL_INQUIRY", priority: "MEDIUM" });
    prismaMock.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
      const account = authors.find((author) => author.id === where.id || author.email === where.email);
      if (account) return Promise.resolve({ ...account, passwordHash });
      if (where.id === "admin-1" || where.email === "admin@example.test") {
        return Promise.resolve({ id: "admin-1", fullName: "Platform Admin", email: "admin@example.test", role: "ADMIN", passwordHash });
      }
      if (where.id === "reader-1") return Promise.resolve({ id: "reader-1", fullName: "Reader", email: "reader@example.test", role: "USER", passwordHash });
      return Promise.resolve(null);
    });
    prismaMock.user.findMany.mockResolvedValue(authors);
    prismaMock.user.findFirst.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(authors.find((author) => author.id === where.id) ?? null));
    prismaMock.book.findMany.mockImplementation(({ where }: { where?: { authorId?: string } }) => Promise.resolve(where?.authorId ? books.filter((book) => book.authorId === where.authorId) : books));
    prismaMock.book.findFirst.mockImplementation(({ where }: { where: { id: string; authorId: string } }) => Promise.resolve(books.find((book) => book.id === where.id && book.authorId === where.authorId) ?? null));
    prismaMock.book.findUnique.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(books.find((book) => book.id === where.id) ?? null));
    prismaMock.ticket.findMany.mockImplementation(({ where }: { where?: { authorId?: string } }) => Promise.resolve(where?.authorId ? tickets.filter((ticket) => ticket.authorId === where.authorId) : tickets));
    prismaMock.ticket.findFirst.mockImplementation(({ where }: { where: { id: string; authorId: string } }) => Promise.resolve(tickets.find((ticket) => ticket.id === where.id && ticket.authorId === where.authorId) ?? null));
    prismaMock.ticket.findUnique.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(tickets.find((ticket) => ticket.id === where.id) ?? null));
    prismaMock.ticket.update.mockImplementation(({ where, data }: { where: { id: string; authorId?: string }; data: any }) => {
      const ticket = tickets.find((record) => record.id === where.id && (!where.authorId || record.authorId === where.authorId));
      if (!ticket) return Promise.reject({ code: "P2025" });
      if (data.messages?.create) {
        return Promise.resolve({ ...ticket, updatedAt: new Date(), messages: [...ticket.messages, { ...data.messages.create, id: "reply-1", createdAt: new Date(), sender: { id: where.authorId ?? "admin-1", fullName: "Avery Author", role: where.authorId ? "AUTHOR" : "ADMIN" }, attachments: [] }] });
      }
      return Promise.resolve({ ...ticket, ...data, updatedAt: new Date(), messages: ticket.messages });
    });
    prismaMock.ticket.count.mockImplementation(({ where }: { where: { authorId: string } }) => Promise.resolve(tickets.filter((ticket) => ticket.authorId === where.authorId).length));
    prismaMock.book.count.mockImplementation(({ where }: { where: { authorId: string } }) => Promise.resolve(books.filter((book) => book.authorId === where.authorId).length));
  });

  it("returns 401 when an author endpoint has no access token", async () => {
    const response = await request(app).get("/api/author/books");
    expect(response.status).toBe(401);
  });

  it("returns 401 for an invalid token", async () => {
    const response = await request(app).get("/api/author/books").set("Authorization", "Bearer not-a-token");
    expect(response.status).toBe(401);
  });

  it("returns 403 when a regular user tries to use the author portal", async () => {
    const response = await request(app).get("/api/author/books").set("Authorization", `Bearer ${tokenFor("reader-1")}`);
    expect(response.status).toBe(403);
  });

  it("returns 403 when an author tries to use admin endpoints", async () => {
    const response = await request(app).get("/api/admin/authors").set("Authorization", `Bearer ${tokenFor("author-a")}`);
    expect(response.status).toBe(403);
  });

  it("lists only the authenticated author’s books", async () => {
    const response = await request(app).get("/api/author/books").set("Authorization", `Bearer ${tokenFor("author-a")}`);
    expect(response.status).toBe(200);
    expect(response.body.data.books.map((book: { id: string }) => book.id)).toEqual(["book-a"]);
    expect(prismaMock.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: "author-a" } }));
  });

  it("hides another author’s book details", async () => {
    const response = await request(app).get("/api/author/books/book-b").set("Authorization", `Bearer ${tokenFor("author-a")}`);
    expect(response.status).toBe(404);
    expect(prismaMock.book.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "book-b", authorId: "author-a" } }));
  });

  it("lists only the authenticated author’s tickets", async () => {
    const response = await request(app).get("/api/author/tickets").set("Authorization", `Bearer ${tokenFor("author-a")}`);
    expect(response.status).toBe(200);
    expect(response.body.data.tickets.map((ticket: { id: string }) => ticket.id)).toEqual(["ticket-a"]);
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: "author-a" } }));
  });

  it("hides another author’s ticket conversation", async () => {
    const response = await request(app).get("/api/author/tickets/ticket-b").set("Authorization", `Bearer ${tokenFor("author-a")}`);
    expect(response.status).toBe(404);
    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "ticket-b", authorId: "author-a" } }));
  });

  it("does not include admin-only notes in an author ticket response", async () => {
    const response = await request(app)
      .get("/api/author/tickets/ticket-a")
      .set("Authorization", "Bearer " + tokenFor("author-a"));
    expect(response.status).toBe(200);
    expect(response.body.data.ticket).not.toHaveProperty("internalNotes");
  });

  it("creates tickets for the authenticated author, ignoring a supplied owner id", async () => {
    prismaMock.ticket.create.mockImplementation(({ data }: { data: { authorId: string; subject: string; messages: { create: { body: string } } } }) => Promise.resolve({
      id: "new-ticket",
      authorId: data.authorId,
      subject: data.subject,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [{ id: "message-1", body: data.messages.create.body, createdAt: new Date(), sender: { id: data.authorId, fullName: "Avery Author", role: "AUTHOR" }, attachments: [] }],
    }));
    const response = await request(app)
      .post("/api/author/tickets")
      .set("Authorization", `Bearer ${tokenFor("author-a")}`)
      .send({ subject: "Question about my book", message: "I have a question about the publishing timeline.", authorId: "author-b" });

    expect(response.status).toBe(201);
    expect(prismaMock.ticket.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorId: "author-a" }) }));
    expect(triageTicket).toHaveBeenCalledWith("Question about my book", "I have a question about the publishing timeline.");
  });

  it("does not allow an author to reply to another author’s ticket", async () => {
    const response = await request(app)
      .post("/api/author/tickets/ticket-b/messages")
      .set("Authorization", `Bearer ${tokenFor("author-a")}`)
      .send({ message: "Can you please help me with this?" });

    expect(response.status).toBe(404);
    expect(prismaMock.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "ticket-b", authorId: "author-a" } }));
  });

  it("allows admins to access all authors, books, and tickets", async () => {
    const authorization = `Bearer ${tokenFor("admin-1")}`;
    const [authorResponse, bookResponse, ticketResponse] = await Promise.all([
      request(app).get("/api/admin/authors").set("Authorization", authorization),
      request(app).get("/api/admin/books").set("Authorization", authorization),
      request(app).get("/api/admin/tickets").set("Authorization", authorization),
    ]);

    expect(authorResponse.status).toBe(200);
    expect(bookResponse.status).toBe(200);
    expect(ticketResponse.status).toBe(200);
    expect(authorResponse.body.data.authors).toHaveLength(2);
    expect(bookResponse.body.data.books).toHaveLength(2);
    expect(ticketResponse.body.data.tickets).toHaveLength(2);
    expect(prismaMock.book.findMany).toHaveBeenCalledWith(expect.not.objectContaining({ where: expect.anything() }));
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("blocks authors from admin workflow endpoints", async () => {
    const authorization = "Bearer " + tokenFor("author-a");
    const responses = await Promise.all([
      request(app).patch("/api/admin/tickets/ticket-a").set("Authorization", authorization).send({ priority: "HIGH" }),
      request(app).post("/api/admin/tickets/ticket-a/assign").set("Authorization", authorization),
      request(app).post("/api/admin/tickets/ticket-a/notes").set("Authorization", authorization).send({ body: "private" }),
      request(app).post("/api/admin/tickets/ticket-a/ai-draft").set("Authorization", authorization),
    ]);
    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403]);
  });

  it("returns 400 for invalid ticket filters", async () => {
    const response = await request(app)
      .get("/api/admin/tickets?priority=URGENT")
      .set("Authorization", "Bearer " + tokenFor("admin-1"));
    expect(response.status).toBe(400);
    expect(prismaMock.ticket.findMany).not.toHaveBeenCalled();
  });

  it("lets admins manually override ticket category and priority", async () => {
    const response = await request(app)
      .patch("/api/admin/tickets/ticket-a")
      .set("Authorization", "Bearer " + tokenFor("admin-1"))
      .send({ category: "ROYALTY_AND_PAYMENTS", priority: "HIGH" });
    expect(response.status).toBe(200);
    expect(prismaMock.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "ticket-a" },
      data: { category: "ROYALTY_AND_PAYMENTS", priority: "HIGH" },
    }));
  });

  it("returns 400 for malformed login input", async () => {
    const response = await request(app).post("/api/auth/author/login").send({ email: "not-an-email", password: "" });
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid support query", async () => {
    const response = await request(app)
      .post("/api/author/tickets")
      .set("Authorization", `Bearer ${tokenFor("author-a")}`)
      .send({ subject: "Help", message: "Short" });
    expect(response.status).toBe(400);
    expect(prismaMock.ticket.create).not.toHaveBeenCalled();
  });

  it("returns 401 when credentials do not belong to an author account", async () => {
    const response = await request(app).post("/api/auth/author/login").send({ email: "admin@example.test", password: "a-strong-author-password" });
    expect(response.status).toBe(401);
  });

  it("issues a JWT for valid author login credentials", async () => {
    const response = await request(app).post("/api/auth/author/login").send({ email: "avery@example.test", password: "a-strong-author-password" });
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe("AUTHOR");
    expect(typeof response.body.data.accessToken).toBe("string");
  });

  it("issues an admin JWT only through the admin login route", async () => {
    const response = await request(app).post("/api/auth/admin/login").send({ email: "admin@example.test", password: "a-strong-author-password" });
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe("ADMIN");
    expect(typeof response.body.data.accessToken).toBe("string");
  });
});
