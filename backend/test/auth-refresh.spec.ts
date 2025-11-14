import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../server';

describe('Auth - refresh', () => {
  it('returns 401 when no refresh cookie', async () => {
    await request(app)
      .post('/api/v1/auth/refresh')
      .expect(401);
  });
});
