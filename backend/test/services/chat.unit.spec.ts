import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client used by chatService
vi.mock("../../src/config/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      eq: vi.fn().mockReturnThis(),
    })),
    supabaseAdmin: null,
  },
}));

// Mock Gemini adapter to avoid external calls
vi.mock("../../src/lib/geminiAdapter", () => ({
  default: {
    processMessage: async ({ onToken }: any) => {
      if (onToken) onToken("tok1");
      return { text: "assistant reply", actions: [] };
    },
  },
}));

// Mock realtime IO getIO
vi.mock("../../src/lib/realtime", () => ({
  getIO: () => ({ to: () => ({ emit: vi.fn() }) }),
}));

import ChatService from "../../src/services/chatService";

describe("ChatService (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addMessageAndMaybeAct persists user message and AI reply", async () => {
    // simple call
    const result = await ChatService.addMessageAndMaybeAct({
      userId: "u1",
      chatId: null,
      message: "Hello",
    });
    expect(result).toHaveProperty("aiMessage");
    expect(result).toHaveProperty("userMessage");
  });
});
