import { AppError } from "../../errors/app-error.js";
import { getOpenAIClient, getOpenAIModel } from "./client.js";
import { loadKnowledgeBase } from "./knowledge-base.js";
import { responsePrompt } from "./response.prompt.js";

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
    const draft = response.output_text.trim();
    if (!draft) throw new Error("AI_EMPTY_DRAFT");
    return { draft, knowledgeBaseConfigured: Boolean(knowledgeBase) };
  } catch (error) {
    const cause = error instanceof Error ? error.name : "unknown";
    const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
    console.warn(JSON.stringify({ level: "warn", event: "ai_draft_unavailable", cause, status }));
    throw new AppError(503, "AI_UNAVAILABLE", "An AI draft is unavailable right now. You can write and send a response manually.");
  }
}
