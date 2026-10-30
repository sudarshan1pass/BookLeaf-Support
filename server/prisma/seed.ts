import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { BCRYPT_ROUNDS } from "../src/config/constants.js";
import { prisma } from "../src/lib/prisma.js";

const seedEnv = z
  .object({
    SEED_ADMIN_NAME: z.string().trim().min(2).max(120),
    SEED_ADMIN_EMAIL: z.email().trim().toLowerCase(),
    SEED_ADMIN_PASSWORD: z.string().min(12).max(72),
    SEED_SAMPLE_AUTHOR_PASSWORD: z.preprocess(
      (value) => value === "" ? undefined : value,
      z.string().min(12).max(72).optional(),
    ),
  })
  .parse(process.env);

const nullableAmount = z.number().finite().nonnegative().nullable();
const sampleDataSchema = z.object({
  authors: z.array(z.object({
    author_id: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    phone: z.string().trim().min(1).max(30),
    city: z.string().trim().min(1).max(120),
    joined_date: z.iso.date(),
    books: z.array(z.object({
      book_id: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(200),
      isbn: z.string().max(20).nullable(),
      genre: z.string().max(80).nullable(),
      publication_date: z.iso.date().nullable(),
      status: z.enum(["Published & Live", "In Production - Cover Design", "In Production - Typesetting"]),
      mrp: nullableAmount,
      author_royalty_per_copy: nullableAmount,
      total_copies_sold: z.number().int().nonnegative(),
      total_royalty_earned: z.number().finite().nonnegative(),
      royalty_paid: z.number().finite().nonnegative(),
      royalty_pending: z.number().finite().nonnegative(),
      last_royalty_payout_date: z.iso.date().nullable(),
      print_partner: z.string().max(160).nullable(),
      available_on: z.array(z.string().trim().min(1)).nullable().transform((value) => value ?? []),
    })).default([]),
  })).min(1),
});

function dateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function bookStatus(status: "Published & Live" | "In Production - Cover Design" | "In Production - Typesetting") {
  return status === "Published & Live" ? "PUBLISHED" as const : "IN_REVIEW" as const;
}

const sampleText = await readFile(new URL("./seed-data/authors.json", import.meta.url), "utf8");
const sampleData = sampleDataSchema.parse(JSON.parse(sampleText));
const authorIds = sampleData.authors.map((author) => author.author_id);
const authorEmails = sampleData.authors.map((author) => author.email);
const bookIds = sampleData.authors.flatMap((author) => author.books.map((book) => book.book_id));

if (new Set(authorIds).size !== authorIds.length || new Set(bookIds).size !== bookIds.length) {
  throw new Error("Sample seed data contains duplicate author or book IDs.");
}
if (authorEmails.includes(seedEnv.SEED_ADMIN_EMAIL)) {
  throw new Error("SEED_ADMIN_EMAIL must not match a sample author email.");
}
if (seedEnv.SEED_SAMPLE_AUTHOR_PASSWORD && process.env.NODE_ENV !== "development") {
  throw new Error("SEED_SAMPLE_AUTHOR_PASSWORD is allowed only when NODE_ENV=development.");
}

try {
  const passwordHash = await bcrypt.hash(seedEnv.SEED_ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    update: { fullName: seedEnv.SEED_ADMIN_NAME, role: "ADMIN" },
    create: {
      fullName: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  const existingUsers = await prisma.user.findMany({
    where: { OR: [{ id: { in: authorIds } }, { email: { in: authorEmails } }] },
    select: { id: true, email: true, role: true },
  });
  const userById = new Map(existingUsers.map((user) => [user.id, user]));
  const userByEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));
  const passwordHashes = new Map<string, string>();
  const existingBooks = await prisma.book.findMany({ where: { id: { in: bookIds } }, select: { id: true, authorId: true } });
  const bookAuthorById = new Map(existingBooks.map((book) => [book.id, book.authorId]));

  for (const author of sampleData.authors) {
    const userWithId = userById.get(author.author_id);
    const userWithEmail = userByEmail.get(author.email);
    if (userWithId && (userWithId.email.toLowerCase() !== author.email || userWithId.role !== "AUTHOR")) {
      throw new Error(`Sample author ID ${author.author_id} already belongs to a different account.`);
    }
    if (userWithEmail && userWithEmail.id !== author.author_id) {
      throw new Error(`Sample author email ${author.email} already belongs to account ${userWithEmail.id}.`);
    }
    if (!userWithId) {
      const initialPassword = seedEnv.SEED_SAMPLE_AUTHOR_PASSWORD ?? randomBytes(48).toString("base64url");
      passwordHashes.set(author.author_id, await bcrypt.hash(initialPassword, BCRYPT_ROUNDS));
    }
    for (const book of author.books) {
      const currentOwnerId = bookAuthorById.get(book.book_id);
      if (currentOwnerId && currentOwnerId !== author.author_id) {
        throw new Error(`Sample book ID ${book.book_id} already belongs to a different author.`);
      }
    }
  }

  await prisma.$transaction(async (transaction) => {
    for (const author of sampleData.authors) {
      const joinedAt = dateOnly(author.joined_date)!;
      await transaction.user.upsert({
        where: { id: author.author_id },
        update: {
          fullName: author.name,
          email: author.email,
          phone: author.phone,
          city: author.city,
          createdAt: joinedAt,
        },
        create: {
          id: author.author_id,
          fullName: author.name,
          email: author.email,
          phone: author.phone,
          city: author.city,
          createdAt: joinedAt,
          passwordHash: passwordHashes.get(author.author_id)!,
          role: "AUTHOR",
        },
      });

      for (const book of author.books) {
        const bookData = {
          authorId: author.author_id,
          title: book.title,
          isbn: book.isbn,
          genre: book.genre,
          status: bookStatus(book.status),
          statusLabel: book.status,
          publicationDate: dateOnly(book.publication_date),
          mrp: book.mrp === null ? null : book.mrp.toFixed(2),
          authorRoyaltyPerCopy: book.author_royalty_per_copy === null ? null : book.author_royalty_per_copy.toFixed(2),
          totalCopiesSold: book.total_copies_sold,
          totalRoyaltyEarned: book.total_royalty_earned.toFixed(2),
          royaltyPaid: book.royalty_paid.toFixed(2),
          royaltyPending: book.royalty_pending.toFixed(2),
          lastRoyaltyPayoutDate: dateOnly(book.last_royalty_payout_date),
          printPartner: book.print_partner,
          availableOn: book.available_on,
        };

        await transaction.book.upsert({
          where: { id: book.book_id },
          update: bookData,
          create: { id: book.book_id, ...bookData },
        });
      }
    }
  });

  console.info(`Seeded administrator account ${admin.email} (${admin.role}).`);
  console.info(`Seeded ${sampleData.authors.length} sample authors and ${bookIds.length} books.`);
  console.info(seedEnv.SEED_SAMPLE_AUTHOR_PASSWORD
    ? "New sample author accounts use the configured local development password."
    : "New sample author accounts received unique random passwords; their sign-in credentials are not known.");
} finally {
  await prisma.$disconnect();
}
