import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";

const MAX_KNOWLEDGE_BYTES = 40_000;

export async function loadKnowledgeBase(): Promise<string | null> {
  if (!env.BOOKLEAF_KNOWLEDGE_BASE_PATH) return null;
  try {
    const contents = await readFile(path.resolve(process.cwd(), env.BOOKLEAF_KNOWLEDGE_BASE_PATH), "utf8");
    return Buffer.byteLength(contents, "utf8") > MAX_KNOWLEDGE_BYTES
      ? Buffer.from(contents, "utf8").subarray(0, MAX_KNOWLEDGE_BYTES).toString("utf8")
      : contents;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return null;
  }
}
