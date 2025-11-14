import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../server';

describe('Auth - register', () => {
  it('should register a new user and set a refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: `test+${Date.now()}@example.com`, password: 'Password123!' })
      .expect(201);

    expect(res.body.success).toBe(true);
    // check cookie header
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie)).toBe(true);
  });
});
