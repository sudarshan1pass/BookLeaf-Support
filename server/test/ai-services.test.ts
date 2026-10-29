import { beforeEach, describe, expect, it, vi } from "vitest";

const aiMock = vi.hoisted(() => ({
  parse: vi.fn(),
  create: vi.fn(),
  loadKnowledgeBase: vi.fn(),
}));

vi.mock("../src/modules/ai/client.js", () => ({
  getOpenAIClient: () => ({ responses: { parse: aiMock.parse, create: aiMock.create } }),
  getOpenAIModel: () => "test-model",
}));
vi.mock("../src/modules/ai/knowledge-base.js", () => ({ loadKnowledgeBase: aiMock.loadKnowledgeBase }));

import { classifyTicket } from "../src/modules/ai/classification.service.js";
import { scoreTicketPriority } from "../src/modules/ai/priority.service.js";
import { generateResponseDraft } from "../src/modules/ai/response.service.js";

describe("AI service requests", () => {
  beforeEach(() => {
    aiMock.parse.mockReset();
    aiMock.create.mockReset();
    aiMock.loadKnowledgeBase.mockReset();
  });

  it("classifies a ticket with schema-constrained output", async () => {
    aiMock.parse.mockResolvedValue({ output_parsed: { category: "ROYALTY_AND_PAYMENTS" } });

    await expect(classifyTicket("Royalty statement", "My payout amount is incorrect.")).resolves.toBe("ROYALTY_AND_PAYMENTS");
    const request = aiMock.parse.mock.calls[0]?.[0] as {
      model: string;
      input: Array<{ content: string }>;
      text: { format: unknown };
      max_output_tokens: number;
      store: boolean;
    };
    expect(request.model).toBe("test-model");
    expect(request.input[0]?.content).toContain("ROYALTY_AND_PAYMENTS");
    expect(request.text.format).toBeDefined();
    expect(request.max_output_tokens).toBe(80);
    expect(request.store).toBe(false);
  });

  it("rejects a classification outside the supported category enum", async () => {
    aiMock.parse.mockResolvedValue({ output_parsed: { category: "URGENT" } });
    await expect(classifyTicket("Question", "Please help me.")).rejects.toThrow("AI_INVALID_CLASSIFICATION");
  });

  it("scores priority with schema-constrained output", async () => {
    aiMock.parse.mockResolvedValue({ output_parsed: { priority: "HIGH" } });

    await expect(scoreTicketPriority("Release issue", "My release is blocked this week.")).resolves.toBe("HIGH");
    const request = aiMock.parse.mock.calls[0]?.[0] as {
      input: Array<{ content: string }>;
      text: { format: unknown };
      store: boolean;
    };
    expect(request.input[0]?.content).toContain("CRITICAL");
    expect(request.text.format).toBeDefined();
    expect(request.store).toBe(false);
  });

  it("rejects a priority outside the supported priority enum", async () => {
    aiMock.parse.mockResolvedValue({ output_parsed: { priority: "URGENT" } });
    await expect(scoreTicketPriority("Question", "Please help me.")).rejects.toThrow("AI_INVALID_PRIORITY");
  });

  it("generates a concise response using the configured Knowledge Base", async () => {
    aiMock.loadKnowledgeBase.mockResolvedValue("Royalty statements are issued quarterly.");
    aiMock.create.mockResolvedValue({ output_text: "I understand your question about royalties. Your statement is issued quarterly. Please share the statement period so we can help further." });

    const result = await generateResponseDraft({
      subject: "Royalty statement",
      messages: [{ role: "author", body: "When will I receive the statement?" }],
    });

    expect(result.knowledgeBaseConfigured).toBe(true);
    expect(result.draft).toContain("quarterly");
    const request = aiMock.create.mock.calls[0]?.[0] as {
      input: Array<{ content: string }>;
      max_output_tokens: number;
      store: boolean;
    };
    expect(request.input[0]?.content).toContain("Royalty statements are issued quarterly.");
    expect(request.input[0]?.content).toContain("clear next step");
    expect(request.max_output_tokens).toBe(350);
    expect(request.store).toBe(false);
  });

  it("does not invent Knowledge Base facts or timelines when no Knowledge Base is configured", async () => {
    aiMock.loadKnowledgeBase.mockResolvedValue(null);
    aiMock.create.mockResolvedValue({ output_text: "I understand your question. Could you share the book title and the date you submitted it so the team can review the status?" });

    const result = await generateResponseDraft({ subject: "Production update", messages: [] });

    expect(result.knowledgeBaseConfigured).toBe(false);
    const request = aiMock.create.mock.calls[0]?.[0] as { input: Array<{ content: string }> };
    expect(request.input[0]?.content).toContain("No BookLeaf Knowledge Base is configured.");
    expect(request.input[0]?.content).toContain("do not invent a timeline");
  });

  it("returns a safe service error for provider failures and invalid draft output", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    aiMock.loadKnowledgeBase.mockResolvedValue(null);
    aiMock.create
      .mockRejectedValueOnce(Object.assign(new Error("provider rate limit details"), { status: 429 }))
      .mockResolvedValueOnce({ output_text: "   " });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(generateResponseDraft({ subject: "Question", messages: [] })).rejects.toMatchObject({
        statusCode: 503,
        code: "AI_UNAVAILABLE",
      });
    }
    expect(warning).toHaveBeenCalledTimes(2);
    warning.mockRestore();
  });
});
