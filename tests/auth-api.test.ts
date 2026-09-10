import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

describe('Auth API Integration Test Suite', () => {
  it('should reject registration with invalid email format', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        name: 'Test User',
        password: 'password123',
        phone: '9876543210',
      }),
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
  });

  it('should reject login with missing credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: '',
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
  });
});
