import type { TicketCategory, TicketPriority } from "../../generated/prisma/client.js";
import { classifyTicket } from "./classification.service.js";
import { scoreTicketPriority } from "./priority.service.js";

function logFallback(kind: string, error: unknown) {
  const cause = error instanceof Error ? error.name : "unknown";
  const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
  console.warn(JSON.stringify({ level: "warn", event: "ai_triage_fallback", kind, cause, status }));
}

export async function triageTicket(subject: string, message: string): Promise<{ category: TicketCategory; priority: TicketPriority }> {
  const [category, priority] = await Promise.all([
    classifyTicket(subject, message)
      .catch((error): TicketCategory => {
        logFallback("classification", error);
        return "GENERAL_INQUIRY";
      }),
    scoreTicketPriority(subject, message)
      .catch((error): TicketPriority => {
        logFallback("priority", error);
        return "MEDIUM";
      }),
  ]);
  return { category, priority };
}
