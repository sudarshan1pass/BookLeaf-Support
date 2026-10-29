import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, getOpenAIModel } from "./client.js";
import { priorityPrompt } from "./priority.prompt.js";

export const ticketPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const priorityOutput = z.object({ priority: z.enum(ticketPriorities) });

export async function scoreTicketPriority(subject: string, message: string) {
  const response = await getOpenAIClient().responses.parse({
    model: getOpenAIModel(),
    input: [{ role: "user", content: priorityPrompt(subject, message) }],
    text: { format: zodTextFormat(priorityOutput, "ticket_priority") },
    max_output_tokens: 80,
    store: false,
  });
  const parsed = priorityOutput.safeParse(response.output_parsed);
  if (!parsed.success) throw new Error("AI_INVALID_PRIORITY");
  return parsed.data.priority;
}
