import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../server';

describe('Auth - login', () => {
  it('rejects invalid credentials', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'bad' })
      .expect(401);
  });
});
