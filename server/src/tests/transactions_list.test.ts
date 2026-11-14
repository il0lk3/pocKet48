import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';

describe('F-03: My Transactions List and Ownership Isolation (TDD)', () => {
  const userAEmail = 'list_user_a@pocket48.local';
  const userBEmail = 'list_user_b@pocket48.local';
  const adminEmail = 'list_admin@pocket48.local';
  const password = 'ListPassword123!';

  let userAId = '';
  let userBId = '';
  let userACookie = '';
  let userBCookie = '';
  let adminCookie = '';

  let foodCategory: { id: string; name: string };
  let salaryCategory: { id: string; name: string };

  let userATxNewestId = '';
  let userATxMiddleId = '';
  let userATxOldestId = '';
  let userBTxId = '';

  const categoryNames = ['ListTestFood', 'ListTestSalary'];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);

    // Clean up previous runs
    await prisma.transaction.deleteMany({
      where: {
        user: { email: { in: [userAEmail, userBEmail, adminEmail] } },
      },
    });

    await prisma.category.deleteMany({
      where: { name: { in: categoryNames } },
    });

    await prisma.session.deleteMany({
      where: {
        user: { email: { in: [userAEmail, userBEmail, adminEmail] } },
      },
    });

    await prisma.user.deleteMany({
      where: { email: { in: [userAEmail, userBEmail, adminEmail] } },
    });

    // Create User A
    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash,
        displayName: 'User A List Test',
        role: 'USER',
        isActive: true,
      },
    });
    userAId = userA.id;

    // Create User B
    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        displayName: 'User B List Test',
        role: 'USER',
        isActive: true,
      },
    });
    userBId = userB.id;

    // Create Admin
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Admin List Test',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });

    // Create Categories
    foodCategory = await prisma.category.create({
      data: {
        name: 'ListTestFood',
        type: 'EXPENSE',
        isActive: true,
      },
    });

    salaryCategory = await prisma.category.create({
      data: {
        name: 'ListTestSalary',
        type: 'INCOME',
        isActive: true,
      },
    });

    // Seed User A's transactions with different dates
    const oldestTx = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: foodCategory.id,
        type: 'EXPENSE',
        amountSatang: BigInt(10000), // 100.00 THB
        transactionDate: '2026-11-01',
        note: 'Oldest expense',
      },
    });
    userATxOldestId = oldestTx.id;

    const middleTx = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: salaryCategory.id,
        type: 'INCOME',
        amountSatang: BigInt(25050), // 250.50 THB
        transactionDate: '2026-11-10',
        note: 'Middle income',
      },
    });
    userATxMiddleId = middleTx.id;

    const newestTx = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: foodCategory.id,
        type: 'EXPENSE',
        amountSatang: BigInt(5000), // 50.00 THB
        transactionDate: '2026-11-12',
        note: 'Newest expense',
      },
    });
    userATxNewestId = newestTx.id;

    // Seed User B's transaction
    const userBTx = await prisma.transaction.create({
      data: {
        userId: userBId,
        categoryId: foodCategory.id,
        type: 'EXPENSE',
        amountSatang: BigInt(99900), // 999.00 THB
        transactionDate: '2026-11-11',
        note: 'User B private transaction',
      },
    });
    userBTxId = userBTx.id;

    // Log in User A
    const loginARes = await request(app)
      .post('/api/auth/login')
      .send({ email: userAEmail, password });
    const cookiesA = loginARes.headers['set-cookie'] as string[];
    userACookie = cookiesA.find((c) => c.startsWith('pocket48_session=')) || '';

    // Log in User B
    const loginBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userBEmail, password });
    const cookiesB = loginBRes.headers['set-cookie'] as string[];
    userBCookie = cookiesB.find((c) => c.startsWith('pocket48_session=')) || '';

    // Log in Admin
    const loginAdminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    const cookiesAdmin = loginAdminRes.headers['set-cookie'] as string[];
    adminCookie = cookiesAdmin.find((c) => c.startsWith('pocket48_session=')) || '';
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({
      where: {
        user: { email: { in: [userAEmail, userBEmail, adminEmail] } },
      },
    });

    await prisma.category.deleteMany({
      where: { name: { in: categoryNames } },
    });

    await prisma.session.deleteMany({
      where: {
        user: { email: { in: [userAEmail, userBEmail, adminEmail] } },
      },
    });

    await prisma.user.deleteMany({
      where: { email: { in: [userAEmail, userBEmail, adminEmail] } },
    });
  });

  // TEST-08: AC-03-01 (Chronological Descending Order)
  it('TEST-08 (AC-03-01): GET /api/transactions returns user own transactions in descending order of transaction date (newest first)', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Cookie', [userACookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);

    // Verify descending order
    expect(res.body.data[0].id).toBe(userATxNewestId);
    expect(res.body.data[0].transactionDate).toBe('2026-11-12');
    expect(res.body.data[0].note).toBe('Newest expense');
    expect(res.body.data[0].amount).toBe(50.00);
    expect(res.body.data[0].amountSatang).toBe(5000);
    expect(res.body.data[0].category.name).toBe('ListTestFood');

    expect(res.body.data[1].id).toBe(userATxMiddleId);
    expect(res.body.data[1].transactionDate).toBe('2026-11-10');
    expect(res.body.data[1].note).toBe('Middle income');
    expect(res.body.data[1].amount).toBe(250.50);
    expect(res.body.data[1].amountSatang).toBe(25050);
    expect(res.body.data[1].category.name).toBe('ListTestSalary');

    expect(res.body.data[2].id).toBe(userATxOldestId);
    expect(res.body.data[2].transactionDate).toBe('2026-11-01');
    expect(res.body.data[2].note).toBe('Oldest expense');
    expect(res.body.data[2].amount).toBe(100.00);
    expect(res.body.data[2].amountSatang).toBe(10000);
    expect(res.body.data[2].category.name).toBe('ListTestFood');
  });

  // TEST-15: AC-03-02 (Ownership Isolation in List)
  it('TEST-15 (AC-03-02): GET /api/transactions contains 100% own transactions and 0% of another user transactions', async () => {
    // User A list
    const resA = await request(app)
      .get('/api/transactions')
      .set('Cookie', [userACookie]);
    expect(resA.status).toBe(200);
    const idsA = resA.body.data.map((tx: { id: string }) => tx.id);
    expect(idsA).toContain(userATxNewestId);
    expect(idsA).toContain(userATxMiddleId);
    expect(idsA).toContain(userATxOldestId);
    expect(idsA).not.toContain(userBTxId);

    // User B list
    const resB = await request(app)
      .get('/api/transactions')
      .set('Cookie', [userBCookie]);
    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(1);
    expect(resB.body.data[0].id).toBe(userBTxId);
    expect(resB.body.data[0].note).toBe('User B private transaction');
    expect(resB.body.data[0].amount).toBe(999.00);
    expect(resB.body.data[0].amountSatang).toBe(99900);
  });

  // TEST-09: AC-05-02 & BR-04 (Private Transaction Isolation via GET /:id returns 404 Not Found)
  it('TEST-09 (AC-05-02 / BR-04): User B requesting User A transaction returns 404 Not Found without disclosing existence', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userATxNewestId}`)
      .set('Cookie', [userBCookie]);

    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // Non-existent ID returns 404
  it('GET /api/transactions/:id with non-existent ID returns 404 Not Found', async () => {
    const res = await request(app)
      .get('/api/transactions/00000000-0000-0000-0000-000000000000')
      .set('Cookie', [userACookie]);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // User A can view their own transaction in full via GET /api/transactions/:id
  it('User A can retrieve their own transaction in full via GET /api/transactions/:id', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userATxNewestId}`)
      .set('Cookie', [userACookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(userATxNewestId);
    expect(res.body.data.amount).toBe(50.00);
    expect(res.body.data.amountSatang).toBe(5000);
    expect(res.body.data.type).toBe('EXPENSE');
    expect(res.body.data.category.name).toBe('ListTestFood');
    expect(res.body.data.note).toBe('Newest expense');
  });

  // TEST-11: AC-05-03 & BR-07 (Administrator refused on transaction list and detail routes)
  it('TEST-11 (AC-05-03 / BR-07): Administrator requesting transaction routes receives 403 Forbidden', async () => {
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', [adminCookie]);
    expect(listRes.status).toBe(403);
    expect(listRes.body.error.code).toBe('FORBIDDEN');

    const detailRes = await request(app)
      .get(`/api/transactions/${userATxNewestId}`)
      .set('Cookie', [adminCookie]);
    expect(detailRes.status).toBe(403);
    expect(detailRes.body.error.code).toBe('FORBIDDEN');
  });

  // Persistence check: verify database record integrity
  it('Persistence Check: Transaction records are fully preserved in PostgreSQL with satang integers', async () => {
    const tx = await prisma.transaction.findUnique({
      where: { id: userATxMiddleId },
      include: { category: true, user: true },
    });

    expect(tx).not.toBeNull();
    expect(tx?.amountSatang).toBe(BigInt(25050));
    expect(tx?.category.name).toBe('ListTestSalary');
    expect(tx?.user.email).toBe(userAEmail);
    expect(tx?.transactionDate).toBe('2026-11-10');
  });
});
