import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';

describe('F-11: Account Administration & Deactivated Login Enforcement (TDD)', () => {
  const adminEmail = 'f11_admin@pocket48.local';
  const user1Email = 'f11_user1@pocket48.local';
  const user2Email = 'f11_user2@pocket48.local';
  const password = 'AdminUsersPass123!';

  let adminId = '';
  let user1Id = '';
  let user2Id = '';
  let adminCookie = '';
  let user1Cookie = '';
  let user2Cookie = '';

  async function cleanup() {
    await prisma.session.deleteMany({
      where: {
        user: { email: { in: [adminEmail, user1Email, user2Email] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, user1Email, user2Email] } },
    });
  }

  beforeAll(async () => {
    await cleanup();
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'F11 Test Admin',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });
    adminId = admin.id;

    const user1 = await prisma.user.create({
      data: {
        email: user1Email,
        passwordHash,
        displayName: 'F11 Test User 1',
        role: 'USER',
        isActive: true,
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: user2Email,
        passwordHash,
        displayName: 'F11 Test User 2',
        role: 'USER',
        isActive: true,
      },
    });
    user2Id = user2.id;

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    adminCookie =
      (loginAdmin.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    const loginUser1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password });
    user1Cookie =
      (loginUser1.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    const loginUser2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password });
    user2Cookie =
      (loginUser2.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';
  });

  afterAll(async () => {
    await cleanup();
  });

  it('TEST-45 (AC-11-01, AC-11-02): Admin lists accounts without passwordHash and toggles a User account active state', async () => {
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const foundUser1 = listRes.body.data.find(
      (u: { id: string }) => u.id === user1Id
    );
    expect(foundUser1).toMatchObject({
      id: user1Id,
      email: user1Email,
      displayName: 'F11 Test User 1',
      role: 'USER',
      isActive: true,
    });

    // NFR-02: Zero passwordHash fields anywhere in response
    for (const u of listRes.body.data) {
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).not.toHaveProperty('password');
    }

    // Deactivate User 1
    const deactivateRes = await request(app)
      .patch(`/api/admin/users/${user1Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data).toMatchObject({
      id: user1Id,
      isActive: false,
    });
    expect(deactivateRes.body.data).not.toHaveProperty('passwordHash');

    // Reactivate User 1
    const reactivateRes = await request(app)
      .patch(`/api/admin/users/${user1Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: true });
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data).toMatchObject({
      id: user1Id,
      isActive: true,
    });

    // Invalid payload & unknown user ID
    const badBody = await request(app)
      .patch(`/api/admin/users/${user1Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: 'yes' });
    expect(badBody.status).toBe(400);

    const unknownUser = await request(app)
      .patch('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie)
      .send({ isActive: false });
    expect(unknownUser.status).toBe(404);
  });

  it('TEST-46 (AC-11-03 / BR-06 / D-09): Deactivated user cannot log in and receives same generic 401 error as wrong password', async () => {
    const patchRes = await request(app)
      .patch(`/api/admin/users/${user2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });
    expect(patchRes.status).toBe(200);

    // Wrong password on active user for exact message comparison
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password: 'WrongPassword999!' });
    expect(wrongPassRes.status).toBe(401);

    // Correct password on deactivated user must return identical generic error
    const deactivatedLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password });
    expect(deactivatedLoginRes.status).toBe(401);
    expect(deactivatedLoginRes.body.error.message).toBe(
      'Invalid email or password'
    );
    expect(deactivatedLoginRes.body.error.message).toBe(
      wrongPassRes.body.error.message
    );
  });

  it('TEST-47 (AC-11-04 / BR-06 / D-09): Deactivating a signed-in user immediately revokes their DB sessions and rejects existing cookies with 401', async () => {
    // Re-activate User 2 and create a fresh signed-in session
    const activateRes = await request(app)
      .patch(`/api/admin/users/${user2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: true });
    expect(activateRes.status).toBe(200);

    const freshLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password });
    expect(freshLogin.status).toBe(200);
    user2Cookie =
      (freshLogin.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    // Verify cookie works before deactivation
    const meBefore = await request(app)
      .get('/api/auth/me')
      .set('Cookie', user2Cookie);
    expect(meBefore.status).toBe(200);

    // Admin deactivates User 2
    const deactivateRes = await request(app)
      .patch(`/api/admin/users/${user2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });
    expect(deactivateRes.status).toBe(200);

    // Existing DB sessions must be deleted immediately
    const remainingSessions = await prisma.session.count({
      where: { userId: user2Id },
    });
    expect(remainingSessions).toBe(0);

    // Prior cookie must fail immediately on /api/auth/me and /api/transactions
    const meAfter = await request(app)
      .get('/api/auth/me')
      .set('Cookie', user2Cookie);
    expect(meAfter.status).toBe(401);

    const txAfter = await request(app)
      .get('/api/transactions')
      .set('Cookie', user2Cookie);
    expect(txAfter.status).toBe(401);
  });

  it('TEST-48 (AC-11-05, AC-11-06): Enforces anonymous 401, USER 403, Admin self-deactivation guard 400 (D-11), and Admin financial privacy 403 (BR-07)', async () => {
    // Anonymous -> 401
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
    expect(
      (
        await request(app)
          .patch(`/api/admin/users/${user1Id}`)
          .send({ isActive: false })
      ).status
    ).toBe(401);

    // Re-login User 1 (earlier TEST-45 toggled User 1 off then on, which cleared User 1's initial session)
    const loginUser1Again = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password });
    expect(loginUser1Again.status).toBe(200);
    user1Cookie =
      (loginUser1Again.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    // USER -> 403 (BR-10)
    expect(
      (await request(app).get('/api/admin/users').set('Cookie', user1Cookie))
        .status
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/admin/users/${user2Id}`)
          .set('Cookie', user1Cookie)
          .send({ isActive: true })
      ).status
    ).toBe(403);

    // Admin self-deactivation -> 400 (D-11)
    const selfDeactivate = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });
    expect(selfDeactivate.status).toBe(400);
    expect(selfDeactivate.body.error.code).toBe('VALIDATION_ERROR');

    // Admin still remains active in DB
    const adminRow = await prisma.user.findUnique({ where: { id: adminId } });
    expect(adminRow?.isActive).toBe(true);

    // Admin financial privacy restriction preserved (BR-07)
    const adminTx = await request(app)
      .get('/api/transactions')
      .set('Cookie', adminCookie);
    expect(adminTx.status).toBe(403);
  });
});
