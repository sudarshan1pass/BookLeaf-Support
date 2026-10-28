import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { AppError } from "../../errors/app-error.js";

const storageDirectory = resolve(process.cwd(), "uploads");
const extensionsByMimeType: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "text/plain": "txt",
};

export type StoredAttachment = {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function storeAttachment(file: Express.Multer.File): Promise<StoredAttachment> {
  const extension = extensionsByMimeType[file.mimetype];
  if (!extension) {
    throw new AppError(400, "UNSUPPORTED_ATTACHMENT", "Attach a PDF, PNG, JPG, or TXT file.");
  }

  const storageKey = `${randomUUID()}.${extension}`;
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(join(storageDirectory, storageKey), file.buffer, { flag: "wx" });

  return {
    storageKey,
    originalName: file.originalname.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 255),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}

export async function removeStoredAttachment(storageKey: string) {
  try {
    await unlink(getAttachmentPath(storageKey));
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}

export function getAttachmentPath(storageKey: string): string {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png|txt)$/.test(storageKey)) {
    throw new AppError(404, "ATTACHMENT_NOT_FOUND", "The attachment was not found.");
  }
  return join(storageDirectory, storageKey);
}
