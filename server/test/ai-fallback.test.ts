import { beforeEach, describe, expect, it, vi } from "vitest";

const aiMock = vi.hoisted(() => ({
  classifyTicket: vi.fn(),
  scoreTicketPriority: vi.fn(),
}));

vi.mock("../src/modules/ai/classification.service.js", () => ({ classifyTicket: aiMock.classifyTicket }));
vi.mock("../src/modules/ai/priority.service.js", () => ({ scoreTicketPriority: aiMock.scoreTicketPriority }));

import { triageTicket } from "../src/modules/ai/ticket-triage.service.js";

describe("AI ticket triage fallback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("falls back independently when classification fails but priority succeeds", async () => {
    aiMock.classifyTicket.mockRejectedValue(new Error("provider unavailable"));
    aiMock.scoreTicketPriority.mockResolvedValue("HIGH");

    await expect(triageTicket("Payment question", "Please check my royalty statement.")).resolves.toEqual({
      category: "GENERAL_INQUIRY",
      priority: "HIGH",
    });
  });

  it("uses safe defaults when both AI calls fail", async () => {
    aiMock.classifyTicket.mockRejectedValue(new Error("rate limited"));
    aiMock.scoreTicketPriority.mockRejectedValue(new Error("rate limited"));

    await expect(triageTicket("Question", "I would like some information.")).resolves.toEqual({
      category: "GENERAL_INQUIRY",
      priority: "MEDIUM",
    });
  });
});
