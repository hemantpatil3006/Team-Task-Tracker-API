import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

/**
 * Integration Test: Authentication Flow
 *
 * Tests the complete auth lifecycle:
 * 1. Register → creates org + ADMIN user
 * 2. Login → returns access + refresh tokens
 * 3. Access protected route with valid token
 * 4. Refresh token rotation
 * 5. Logout → revokes refresh token
 * 6. Verify revoked refresh token is rejected
 */
describe('Auth Flow', () => {
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'TestPass1234!';

  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    // Clean up test data
    await prisma.user
      .findUnique({ where: { email: testEmail } })
      .then((u) => u && prisma.organization.delete({ where: { id: u.organizationId } }))
      .catch(() => {});
  });

  it('POST /api/v1/auth/register — should register a new user and org', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: testPassword,
        organizationName: 'Test Org',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    // Password hash must never be in response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/register — should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        password: testPassword,
        organizationName: 'Another Org',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/login — should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/login — should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me — should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('GET /api/v1/auth/me — should reject missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/refresh — should rotate refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    // New tokens should be different
    expect(res.body.data.tokens.refreshToken).not.toBe(refreshToken);

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/logout — should revoke the refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });

  it('POST /api/v1/auth/refresh — should reject revoked refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
