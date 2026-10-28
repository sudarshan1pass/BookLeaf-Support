import OpenAI from "openai";
import { env } from "../../config/env.js";

let openAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new Error("AI_NOT_CONFIGURED");
  openAIClient ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: env.OPENAI_TIMEOUT_MS,
    maxRetries: 0,
  });
  return openAIClient;
}

export function getOpenAIModel() {
  return env.OPENAI_MODEL;
}
