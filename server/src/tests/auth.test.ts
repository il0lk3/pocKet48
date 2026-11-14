import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';

describe('F-01: Authentication & Session Contracts (TDD)', () => {
  const testUserEmail = 'auth_test_user@pocket48.local';
  const testUserPassword = 'ValidPassword123!';
  const deactivatedUserEmail = 'deactivated_user@pocket48.local';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(testUserPassword, 10);

    // Ensure clean state and seed test users
    await prisma.session.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUserEmail, deactivatedUserEmail] },
      },
    });

    await prisma.user.create({
      data: {
        email: testUserEmail,
        passwordHash,
        displayName: 'Auth Test User',
        role: 'USER',
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        email: deactivatedUserEmail,
        passwordHash,
        displayName: 'Deactivated User',
        role: 'USER',
        isActive: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUserEmail, deactivatedUserEmail] },
      },
    });
    await prisma.$disconnect();
  });

  // TEST-01: AC-01-01 (Valid Login)
  it('TEST-01: Valid login returns 200, sets pocket48_session cookie, and returns user profile without password or hash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(testUserEmail);
    expect(res.body.data.displayName).toBe('Auth Test User');
    expect(res.body.data.role).toBe('USER');

    // Security check: Never leak password or passwordHash in response
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();

    // Verify session cookie is set and HttpOnly
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies?.find((c: string) => c.startsWith('pocket48_session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
  });

  // TEST-02: AC-01-02 (Invalid Login)
  it('TEST-02: Incorrect password returns 401 with generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('TEST-02: Non-existent email returns 401 with generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@pocket48.local', password: testUserPassword });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('Deactivated user cannot log in and returns 401 with generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: deactivatedUserEmail, password: testUserPassword });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  // TEST-17: AC-05-01 (Unauthenticated Rejection)
  it('TEST-17: GET /api/auth/me without session cookie returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('Unauthenticated POST /api/auth/logout returns 401 (system-sds.md Section 3.3 matrix)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // NFR-03: Expired session handling & cleanup
  it('NFR-03: Expired session returns 401 on /api/auth/me and is cleaned up from PostgreSQL', async () => {
    // 1. Clean existing sessions and log in to get signed session cookie
    await prisma.session.deleteMany();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });
    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c: string) => c.startsWith('pocket48_session='));

    // 2. Artificially expire the session in PostgreSQL
    const activeSessions = await prisma.session.findMany({
      where: { user: { email: testUserEmail } },
    });
    expect(activeSessions.length).toBe(1);
    const targetSession = activeSessions[0];

    await prisma.session.update({
      where: { id: targetSession.id },
      data: { expiresAt: new Date(Date.now() - 5000) }, // Expired 5 seconds ago
    });

    // 3. Requesting /me with expired session must return 401
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [sessionCookie]);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toBeDefined();

    // 4. Verify session was cleaned up from DB
    const deletedSession = await prisma.session.findUnique({
      where: { id: targetSession.id },
    });
    expect(deletedSession).toBeNull();
  });

  // TEST-03 & TEST-14: Logout & Role Integrity
  it('TEST-03 & TEST-14: Valid session can access /me, role comes strictly from DB, and logout invalidates session', async () => {
    // 1. Log in to acquire session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });
    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c: string) => c.startsWith('pocket48_session='));

    // 2. Call GET /api/auth/me with session cookie (TEST-14 role integrity)
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [sessionCookie])
      .send({ role: 'ADMINISTRATOR' }); // Try to forge role payload

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.role).toBe('USER'); // Role strictly reflects DB

    // 3. Call POST /api/auth/logout to terminate session (TEST-03)
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [sessionCookie]);

    expect(logoutRes.status).toBe(200);

    // 4. Subsequent call to /me must return 401
    const postLogoutMeRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [sessionCookie]);

    expect(postLogoutMeRes.status).toBe(401);
  });
});
