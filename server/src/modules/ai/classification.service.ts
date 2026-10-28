import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, getOpenAIModel } from "./client.js";
import { classificationPrompt } from "./classification.prompt.js";

export const ticketCategories = [
  "ROYALTY_AND_PAYMENTS",
  "ISBN_AND_METADATA_ISSUES",
  "PRINTING_AND_QUALITY",
  "DISTRIBUTION_AND_AVAILABILITY",
  "BOOK_STATUS_AND_PRODUCTION_UPDATES",
  "GENERAL_INQUIRY",
] as const;

const classificationOutput = z.object({ category: z.enum(ticketCategories) });

export async function classifyTicket(subject: string, message: string) {
  const response = await getOpenAIClient().responses.parse({
    model: getOpenAIModel(),
    input: [{ role: "user", content: classificationPrompt(subject, message) }],
    text: { format: zodTextFormat(classificationOutput, "ticket_classification") },
    max_output_tokens: 80,
    store: false,
  });
  if (!response.output_parsed) throw new Error("AI_EMPTY_CLASSIFICATION");
  return response.output_parsed.category;
}
