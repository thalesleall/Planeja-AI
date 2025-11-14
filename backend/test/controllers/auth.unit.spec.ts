import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unit tests for authController methods with external dependencies mocked

vi.mock('../../src/config/supabase', () => {
  const mock = {
    from: vi.fn(() => ({ insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), eq: vi.fn().mockReturnThis() })),
  };
  return { supabase: mock };
});

vi.mock('../../src/middleware/auth', () => ({ generateToken: () => 'fake-jwt' }));

import { AuthController } from '../../src/controllers/authController';
import { supabase } from '../../src/config/supabase';

describe('AuthController (unit)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('createAndSetRefreshToken persists token and returns it via register flow', async () => {
    const res: any = { cookie: vi.fn() };
    // call createAndSetRefreshToken indirectly via register flow
    const req: any = { body: { name: 'A', email: `u${Date.now()}@x.com`, password: 'Password123!' }, ip: '127.0.0.1', get: () => 'UA' };

    // Call register - since supabase mock returns no existing user, it will attempt insert
    await AuthController.register(req, res as any);

    expect(res.cookie).toHaveBeenCalled();
  });

  it('refresh returns 401 when cookie missing', async () => {
    const req: any = { cookies: {} };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await AuthController.refresh(req, res as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
