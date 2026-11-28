import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';
import {
  computeMonthlySummary,
  formatSatangToTHB,
  validateMonthParam,
} from '../utils/summaryCalculation';

describe('F-09a: Monthly Summary API & Exact Satang Arithmetic (TDD)', () => {
  const userAEmail = 'summary_user_a@pocket48.local';
  const userBEmail = 'summary_user_b@pocket48.local';
  const adminEmail = 'summary_admin@pocket48.local';
  const password = 'SummaryPassword123!';

  const categoryNames = [
    'SummaryTestFood',
    'SummaryTestTransport',
    'SummaryTestSalary',
  ];

  let userAId = '';
  let userBId = '';
  let userACookie = '';
  let adminCookie = '';

  let foodCategoryId = '';
  let transportCategoryId = '';
  let salaryCategoryId = '';

  async function cleanup() {
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
  }

  beforeAll(async () => {
    await cleanup();
    const passwordHash = await bcrypt.hash(password, 10);

    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash,
        displayName: 'User A Summary Test',
        role: 'USER',
        isActive: true,
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        displayName: 'User B Summary Test',
        role: 'USER',
        isActive: true,
      },
    });
    userBId = userB.id;

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Admin Summary Test',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });

    const food = await prisma.category.create({
      data: { name: 'SummaryTestFood', type: 'EXPENSE', isActive: true },
    });
    foodCategoryId = food.id;

    const transport = await prisma.category.create({
      data: { name: 'SummaryTestTransport', type: 'EXPENSE', isActive: true },
    });
    transportCategoryId = transport.id;

    const salary = await prisma.category.create({
      data: { name: 'SummaryTestSalary', type: 'INCOME', isActive: true },
    });
    salaryCategoryId = salary.id;

    // User A transactions in 2026-11 (boundary days 01 and 30 inclusive)
    await prisma.transaction.createMany({
      data: [
        {
          userId: userAId,
          categoryId: salaryCategoryId,
          type: 'INCOME',
          amountSatang: BigInt(500000), // 5000.00
          transactionDate: '2026-11-01',
          note: 'Nov salary',
        },
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(12050), // 120.50
          transactionDate: '2026-11-10',
          note: 'Nov lunch',
        },
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(7950), // 79.50 -> Food total 200.00
          transactionDate: '2026-11-30',
          note: 'Nov dinner boundary',
        },
        {
          userId: userAId,
          categoryId: transportCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(4525), // 45.25
          transactionDate: '2026-11-15',
          note: 'Nov BTS',
        },
        // Adjacent months for User A (must be excluded from 2026-11)
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(99900),
          transactionDate: '2026-10-31',
          note: 'Oct boundary',
        },
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(88800),
          transactionDate: '2026-12-01',
          note: 'Dec boundary',
        },
        // Exactness dataset in 2026-09 (0.10 + 0.20 = 0.30, negative balance)
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(10), // 0.10
          transactionDate: '2026-09-05',
          note: 'Ten satang',
        },
        {
          userId: userAId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amountSatang: BigInt(20), // 0.20
          transactionDate: '2026-09-06',
          note: 'Twenty satang',
        },
        // User B transaction in 2026-11 (must NEVER leak into User A summary)
        {
          userId: userBId,
          categoryId: salaryCategoryId,
          type: 'INCOME',
          amountSatang: BigInt(777700),
          transactionDate: '2026-11-12',
          note: 'User B private salary',
        },
      ],
    });

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: userAEmail, password });
    userACookie =
      (loginA.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    adminCookie =
      (loginAdmin.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';
  });

  afterAll(async () => {
    await cleanup();
  });

  it('TEST-35 (AC-09-01, AC-09-02): GET /api/summary?month=2026-11 returns exact totals, derived balance (BR-08), and per-category breakdown excluding adjacent months', async () => {
    const res = await request(app)
      .get('/api/summary?month=2026-11')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      month: '2026-11',
      totalIncome: 5000,
      totalExpense: 245.25,
      balance: 4754.75,
      totalIncomeSatang: 500000,
      totalExpenseSatang: 24525,
      balanceSatang: 475475,
      expenseByCategory: [
        {
          categoryId: foodCategoryId,
          categoryName: 'SummaryTestFood',
          totalSatang: 20000,
          total: 200,
          transactionCount: 2,
        },
        {
          categoryId: transportCategoryId,
          categoryName: 'SummaryTestTransport',
          totalSatang: 4525,
          total: 45.25,
          transactionCount: 1,
        },
      ],
    });
  });

  it('TEST-36 (AC-09-03 / NFR-07): Monthly summary sums 0.10 + 0.20 to exactly 0.30 (30 satang) with zero floating-point drift and exact negative balance', async () => {
    const res = await request(app)
      .get('/api/summary?month=2026-09')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncomeSatang).toBe(0);
    expect(res.body.data.totalExpenseSatang).toBe(30);
    expect(res.body.data.balanceSatang).toBe(-30);
    expect(res.body.data.totalExpense).toBe(0.3);
    expect(res.body.data.balance).toBe(-0.3);
    expect(res.body.data.expenseByCategory).toEqual([
      {
        categoryId: foodCategoryId,
        categoryName: 'SummaryTestFood',
        totalSatang: 30,
        total: 0.3,
        transactionCount: 2,
      },
    ]);
  });

  it('TEST-37 (AC-09-04): Summary enforces ownership isolation, returns 401 for anonymous, and 403 for Administrator (BR-07)', async () => {
    const anonRes = await request(app).get('/api/summary?month=2026-11');
    expect(anonRes.status).toBe(401);

    const adminRes = await request(app)
      .get('/api/summary?month=2026-11')
      .set('Cookie', adminCookie);
    expect(adminRes.status).toBe(403);
    expect(adminRes.body.data).toBeUndefined();

    // Confirm User A totals excluded User B's 7777.00 income
    const userARes = await request(app)
      .get('/api/summary?month=2026-11')
      .set('Cookie', userACookie);
    expect(userARes.status).toBe(200);
    expect(userARes.body.data.totalIncomeSatang).toBe(500000);
  });

  it('TEST-38 (AC-09-05, AC-09-06): Empty month returns zeros and empty breakdown; missing or invalid month returns 400', async () => {
    const emptyRes = await request(app)
      .get('/api/summary?month=2020-01')
      .set('Cookie', userACookie);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data).toEqual({
      month: '2020-01',
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      totalIncomeSatang: 0,
      totalExpenseSatang: 0,
      balanceSatang: 0,
      expenseByCategory: [],
    });

    const invalidQueries = ['', '?month=', '?month=2026-00', '?month=2026-13', '?month=nov-2026', '?month=2026-1'];
    for (const q of invalidQueries) {
      const res = await request(app)
        .get(`/api/summary${q}`)
        .set('Cookie', userACookie);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('Domain Unit Tests: summaryCalculation (BR-08, NFR-07, D-10)', () => {
  it('TEST-36 (Unit / NFR-07): computeMonthlySummary and formatSatangToTHB sum 0.10 + 0.20 to exact 0.30 with zero floating-point drift', () => {
    const result = computeMonthlySummary('2026-11', [
      {
        type: 'EXPENSE',
        amountSatang: 10n,
        categoryId: 'cat-food',
        category: { id: 'cat-food', name: 'Food' },
      },
      {
        type: 'EXPENSE',
        amountSatang: 20n,
        categoryId: 'cat-food',
        category: { id: 'cat-food', name: 'Food' },
      },
    ]);

    expect(result.totalExpenseSatang).toBe(30);
    expect(result.totalExpense).toBe(0.3);
    expect(formatSatangToTHB(BigInt(result.totalExpenseSatang))).toBe('0.30');
    expect(formatSatangToTHB(BigInt(result.balanceSatang))).toBe('-0.30');
  });

  it('validateMonthParam resolves leap-year and non-leap-year month end boundaries accurately', () => {
    expect(validateMonthParam('2024-02')).toEqual({
      valid: true,
      value: { month: '2024-02', startDate: '2024-02-01', endDate: '2024-02-29' },
    });
    expect(validateMonthParam('2026-02')).toEqual({
      valid: true,
      value: { month: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' },
    });
    expect(validateMonthParam('2026-11')).toEqual({
      valid: true,
      value: { month: '2026-11', startDate: '2026-11-01', endDate: '2026-11-30' },
    });
    expect(validateMonthParam('2026-13').valid).toBe(false);
  });
});
