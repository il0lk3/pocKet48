import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';

describe('F-04 & F-05: Category Catalogue and Role Enforcement (TDD)', () => {
  const adminEmail = 'cat_test_admin@pocket48.local';
  const userEmail = 'cat_test_user@pocket48.local';
  const password = 'CategoryTestPass123!';

  let adminCookie = '';
  let userCookie = '';

  const createdCategoryNames = ['HealthTestCat', 'TravelTestCat', 'InactiveTestCat'];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.category.deleteMany({
      where: {
        name: { in: [...createdCategoryNames, 'healthtestcat', 'HEALTHtestCAT'] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, userEmail] },
      },
    });

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Category Test Admin',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash,
        displayName: 'Category Test User',
        role: 'USER',
        isActive: true,
      },
    });

    // Seed one active and one inactive category for TEST-19
    await prisma.category.create({
      data: {
        name: 'TravelTestCat',
        type: 'EXPENSE',
        isActive: true,
      },
    });

    await prisma.category.create({
      data: {
        name: 'InactiveTestCat',
        type: 'EXPENSE',
        isActive: false,
      },
    });

    // Log in as Administrator
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    const adminCookies = adminLogin.headers['set-cookie'] as string[];
    adminCookie = adminCookies.find((c) => c.startsWith('pocket48_session=')) || '';

    // Log in as User
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password });
    const userCookies = userLogin.headers['set-cookie'] as string[];
    userCookie = userCookies.find((c) => c.startsWith('pocket48_session=')) || '';
  });

  afterAll(async () => {
    await prisma.category.deleteMany({
      where: {
        name: { in: [...createdCategoryNames, 'healthtestcat', 'HEALTHtestCAT'] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, userEmail] },
      },
    });
    await prisma.$disconnect();
  });

  // TEST-16: AC-04-01 (Admin Create Category)
  it('TEST-16 (AC-04-01): Administrator can create a valid category (201 Created) and it persists in the database', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [adminCookie])
      .send({ name: 'HealthTestCat', type: 'EXPENSE' });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('HealthTestCat');
    expect(res.body.data.type).toBe('EXPENSE');
    expect(res.body.data.isActive).toBe(true);

    const saved = await prisma.category.findFirst({
      where: { name: 'HealthTestCat', type: 'EXPENSE' },
    });
    expect(saved).not.toBeNull();
  });

  // TEST-12: AC-04-02 (Duplicate Name Rejection - Case Insensitive within Type)
  it('TEST-12 (AC-04-02): Duplicate category name differing only by letter case within the same type returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [adminCookie])
      .send({ name: 'healthtestcat', type: 'EXPENSE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // BR-05 boundary validation (1 to 40 characters and valid type)
  it('BR-05: Rejects empty category name or name exceeding 40 characters with 400 Bad Request', async () => {
    const emptyRes = await request(app)
      .post('/api/categories')
      .set('Cookie', [adminCookie])
      .send({ name: '   ', type: 'EXPENSE' });
    expect(emptyRes.status).toBe(400);

    const longName = 'A'.repeat(41);
    const longRes = await request(app)
      .post('/api/categories')
      .set('Cookie', [adminCookie])
      .send({ name: longName, type: 'EXPENSE' });
    expect(longRes.status).toBe(400);
  });

  // TEST-10: AC-04-03 (User Forbidden on POST /api/categories)
  it('TEST-10 (AC-04-03): User attempting to create a category receives 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [userCookie])
      .send({ name: 'UserBonusCat', type: 'INCOME' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TEST-19: AC-04-04 (List Active Categories for any signed-in user)
  it('TEST-19 (AC-04-04): Signed-in User and Administrator can list active categories via GET /api/categories while inactive categories are excluded', async () => {
    const userRes = await request(app)
      .get('/api/categories')
      .set('Cookie', [userCookie]);

    expect(userRes.status).toBe(200);
    expect(Array.isArray(userRes.body.data)).toBe(true);

    const names = userRes.body.data.map((c: { name: string }) => c.name);
    expect(names).toContain('TravelTestCat');
    expect(names).toContain('HealthTestCat');
    expect(names).not.toContain('InactiveTestCat');

    const adminRes = await request(app)
      .get('/api/categories')
      .set('Cookie', [adminCookie]);
    expect(adminRes.status).toBe(200);
  });

  // TEST-11: AC-05-03 (Administrator refused on transaction routes)
  it('TEST-11 (AC-05-03): Administrator requesting /api/transactions receives 403 Forbidden', async () => {
    const getRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', [adminCookie]);
    expect(getRes.status).toBe(403);

    const postRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [adminCookie])
      .send({});
    expect(postRes.status).toBe(403);
  });

  // TEST-17: AC-05-01 (Anonymous request to every protected route returns 401)
  it('TEST-17 (AC-05-01): Anonymous requests across all protected routes return 401 Unauthorized without private data', async () => {
    const protectedRoutes: { method: 'get' | 'post'; path: string }[] = [
      { method: 'get', path: '/api/auth/me' },
      { method: 'post', path: '/api/auth/logout' },
      { method: 'get', path: '/api/categories' },
      { method: 'post', path: '/api/categories' },
      { method: 'get', path: '/api/transactions' },
      { method: 'post', path: '/api/transactions' },
    ];

    for (const route of protectedRoutes) {
      const res = await request(app)[route.method](route.path);
      expect(res.status).toBe(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).toBeDefined();
    }
  });
});
