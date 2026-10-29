import { AppError } from "../../errors/app-error.js";
import { z } from "zod";
import { getOpenAIClient, getOpenAIModel } from "./client.js";
import { loadKnowledgeBase } from "./knowledge-base.js";
import { responsePrompt } from "./response.prompt.js";

const responseDraftOutput = z.string().trim().min(1).max(5000);

export async function generateResponseDraft(context: {
  subject: string;
  messages: Array<{ role: "author" | "support"; body: string }>;
}) {
  try {
    const knowledgeBase = await loadKnowledgeBase();
    const response = await getOpenAIClient().responses.create({
      model: getOpenAIModel(),
      input: [{ role: "user", content: responsePrompt({ ...context, knowledgeBase }) }],
      max_output_tokens: 350,
      store: false,
    });
    const parsedDraft = responseDraftOutput.safeParse(response.output_text);
    if (!parsedDraft.success) throw new Error("AI_INVALID_DRAFT");
    return { draft: parsedDraft.data, knowledgeBaseConfigured: Boolean(knowledgeBase) };
  } catch (error) {
    const cause = error instanceof Error ? error.name : "unknown";
    const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
    console.warn(JSON.stringify({ level: "warn", event: "ai_draft_unavailable", cause, status }));
    throw new AppError(503, "AI_UNAVAILABLE", "An AI draft is unavailable right now. You can write and send a response manually.");
  }
}
