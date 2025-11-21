import { describe, it, expect, vi, beforeEach } from "vitest";

// Unit tests for authController methods with external dependencies mocked

vi.mock("../../src/config/supabase", () => {
  const builder: any = {
    _insertFlow: false,
    insert: vi.fn(function () {
      builder._insertFlow = true;
      return builder;
    }),
    select: vi.fn(function () {
      return builder;
    }),
    single: vi.fn(async () => {
      if (builder._insertFlow) {
        builder._insertFlow = false;
        return {
          data: { id: 1, name: "Test User", email: "test@example.com" },
          error: null,
        };
      }
      return { data: null, error: null };
    }),
    eq: vi.fn(function () {
      return builder;
    }),
  };

  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

vi.mock("../../src/middleware/auth", () => ({
  generateToken: () => "fake-jwt",
}));

import { AuthController } from "../../src/controllers/authController";
import { supabase } from "../../src/config/supabase";

describe("AuthController (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAndSetRefreshToken persists token and returns it via register flow", async () => {
    const res: any = {
      cookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    // call createAndSetRefreshToken indirectly via register flow
    const req: any = {
      body: {
        name: "A",
        email: `u${Date.now()}@x.com`,
        password: "Password123!",
      },
      ip: "127.0.0.1",
      get: () => "UA",
    };

    // Call register - since supabase mock returns no existing user, it will attempt insert
    await AuthController.register(req, res as any);

    expect(res.cookie).toHaveBeenCalled();
  });

  it("refresh returns 401 when cookie missing", async () => {
    const req: any = { cookies: {} };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await AuthController.refresh(req, res as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
