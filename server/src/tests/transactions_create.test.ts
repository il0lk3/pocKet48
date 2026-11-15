import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';
import {
  validateAmount,
  validateCategoryMatch,
  validateTransactionDate,
  validateNote,
} from '../utils/transactionValidation';

describe('F-02: Record a Transaction Contracts & Business Rules (TDD)', () => {
  const userEmail = 'tx_test_user@pocket48.local';
  const password = 'TxTestPassword123!';
  let userCookie = '';
  let userId = '';

  let foodExpenseCategory: { id: string; name: string };
  let salaryIncomeCategory: { id: string; name: string };
  let inactiveCategory: { id: string; name: string };

  const createdCategoryNames = ['TxTestFood', 'TxTestSalary', 'TxTestInactive'];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);

    // Clean up test data
    await prisma.transaction.deleteMany({
      where: {
        user: { email: userEmail },
      },
    });

    await prisma.category.deleteMany({
      where: {
        name: { in: createdCategoryNames },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: userEmail,
      },
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash,
        displayName: 'Tx Test User',
        role: 'USER',
        isActive: true,
      },
    });
    userId = user.id;

    // Create categories
    foodExpenseCategory = await prisma.category.create({
      data: {
        name: 'TxTestFood',
        type: 'EXPENSE',
        isActive: true,
      },
    });

    salaryIncomeCategory = await prisma.category.create({
      data: {
        name: 'TxTestSalary',
        type: 'INCOME',
        isActive: true,
      },
    });

    inactiveCategory = await prisma.category.create({
      data: {
        name: 'TxTestInactive',
        type: 'EXPENSE',
        isActive: false,
      },
    });

    // Log in to obtain authenticated session cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password });
    const cookies = loginRes.headers['set-cookie'] as string[];
    userCookie = cookies.find((c) => c.startsWith('pocket48_session=')) || '';
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({
      where: {
        user: { email: userEmail },
      },
    });

    await prisma.category.deleteMany({
      where: {
        name: { in: createdCategoryNames },
      },
    });

    await prisma.session.deleteMany({
      where: { userId },
    });

    await prisma.user.deleteMany({
      where: { email: userEmail },
    });
  });

  // TEST-04: AC-02-01 (Valid Transaction Recording and Satang Storage)
  it('TEST-04 (AC-02-01): User creates a valid expense of 120.50 THB and it is stored as 12050 integer satang in database', async () => {
    const initialCount = await prisma.transaction.count({ where: { userId } });

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 120.50,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2026-11-10',
        note: 'Lunch with team',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.type).toBe('EXPENSE');
    expect(res.body.data.amount).toBe(120.50);
    expect(res.body.data.amountSatang).toBe(12050);
    expect(res.body.data.categoryId).toBe(foodExpenseCategory.id);
    expect(res.body.data.transactionDate).toBe('2026-11-10');
    expect(res.body.data.note).toBe('Lunch with team');
    expect(res.body.data.createdAt).toBeDefined();

    // Verify database record directly
    const dbRecord = await prisma.transaction.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.amountSatang).toBe(BigInt(12050));
    expect(dbRecord?.userId).toBe(userId);
    expect(dbRecord?.categoryId).toBe(foodExpenseCategory.id);
    expect(dbRecord?.type).toBe('EXPENSE');
    expect(dbRecord?.transactionDate).toBe('2026-11-10');
    expect(dbRecord?.note).toBe('Lunch with team');

    const newCount = await prisma.transaction.count({ where: { userId } });
    expect(newCount).toBe(initialCount + 1);
  });

  // TEST-05: AC-02-02 & BR-01 (Amount Boundary Rejections)
  it('TEST-05 (AC-02-02 / BR-01): Rejects amounts <= 0, > 9,999,999.99, and > 2 decimal places with 400 Bad Request, saving nothing', async () => {
    const countBefore = await prisma.transaction.count({ where: { userId } });

    const invalidAmounts = [
      0,
      -10,
      -0.01,
      0.001,
      12.345,
      10000000,
      10000000.01,
      NaN,
      'invalid-amount',
    ];

    for (const invalidAmount of invalidAmounts) {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', [userCookie])
        .send({
          type: 'EXPENSE',
          amount: invalidAmount,
          categoryId: foodExpenseCategory.id,
          transactionDate: '2026-11-10',
          note: 'Invalid amount attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }

    // Valid lower boundary: 0.01 THB (1 satang)
    const minRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 0.01,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2026-11-10',
        note: 'Min boundary 1 satang',
      });
    expect(minRes.status).toBe(201);
    expect(minRes.body.data.amountSatang).toBe(1);

    // Valid upper boundary: 9,999,999.99 THB (999,999,999 satang)
    const maxRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 9999999.99,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2026-11-10',
        note: 'Max boundary 999,999,999 satang',
      });
    expect(maxRes.status).toBe(201);
    expect(maxRes.body.data.amountSatang).toBe(999999999);

    const countAfter = await prisma.transaction.count({ where: { userId } });
    // Only the two valid boundary transactions were added
    expect(countAfter).toBe(countBefore + 2);
  });

  // TEST-06: AC-02-03 & BR-02 (Category Type Mismatch and Active Status Rejection)
  it('TEST-06 (AC-02-03 / BR-02): Rejects category type mismatch, nonexistent category, and inactive category with 400 Bad Request, saving nothing', async () => {
    const countBefore = await prisma.transaction.count({ where: { userId } });

    // EXPENSE with INCOME category
    const expenseWithIncomeCat = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 50.00,
        categoryId: salaryIncomeCategory.id,
        transactionDate: '2026-11-10',
      });
    expect(expenseWithIncomeCat.status).toBe(400);
    expect(expenseWithIncomeCat.body.error.code).toBe('VALIDATION_ERROR');

    // INCOME with EXPENSE category
    const incomeWithExpenseCat = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'INCOME',
        amount: 5000.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2026-11-10',
      });
    expect(incomeWithExpenseCat.status).toBe(400);
    expect(incomeWithExpenseCat.body.error.code).toBe('VALIDATION_ERROR');

    // Non-existent category ID
    const nonexistentCat = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 50.00,
        categoryId: '00000000-0000-0000-0000-000000000000',
        transactionDate: '2026-11-10',
      });
    expect(nonexistentCat.status).toBe(400);
    expect(nonexistentCat.body.error.code).toBe('VALIDATION_ERROR');

    // Inactive category
    const inactiveCatRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 50.00,
        categoryId: inactiveCategory.id,
        transactionDate: '2026-11-10',
      });
    expect(inactiveCatRes.status).toBe(400);
    expect(inactiveCatRes.body.error.code).toBe('VALIDATION_ERROR');

    const countAfter = await prisma.transaction.count({ where: { userId } });
    expect(countAfter).toBe(countBefore);
  });

  // TEST-07: AC-02-04 & BR-03 (Future Date Rejection in Asia/Bangkok)
  it('TEST-07 (AC-02-04 / BR-03): Rejects future dates in Asia/Bangkok (UTC+7) with 400 Bad Request, saving nothing', async () => {
    const countBefore = await prisma.transaction.count({ where: { userId } });

    // Calculate today and tomorrow in Asia/Bangkok
    const todayBangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowBangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(tomorrowDate);

    // Tomorrow is rejected
    const tomorrowRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 80.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: tomorrowBangkok,
      });
    expect(tomorrowRes.status).toBe(400);
    expect(tomorrowRes.body.error.code).toBe('VALIDATION_ERROR');

    // Far future date is rejected
    const futureRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 80.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2099-12-31',
      });
    expect(futureRes.status).toBe(400);
    expect(futureRes.body.error.code).toBe('VALIDATION_ERROR');

    // Malformed date string is rejected
    const malformedRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 80.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: 'invalid-date-string',
      });
    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error.code).toBe('VALIDATION_ERROR');

    // Today in Asia/Bangkok is accepted
    const todayRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 80.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: todayBangkok,
        note: 'Today transaction',
      });
    expect(todayRes.status).toBe(201);
    expect(todayRes.body.data.transactionDate).toBe(todayBangkok);

    // Past date is accepted
    const pastRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 80.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2020-01-01',
        note: 'Past transaction',
      });
    expect(pastRes.status).toBe(201);
    expect(pastRes.body.data.transactionDate).toBe('2020-01-01');

    const countAfter = await prisma.transaction.count({ where: { userId } });
    expect(countAfter).toBe(countBefore + 2);
  });

  // Note length boundary check
  it('rejects notes exceeding 200 characters with 400 Bad Request', async () => {
    const longNote = 'X'.repeat(201);
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userCookie])
      .send({
        type: 'EXPENSE',
        amount: 50.00,
        categoryId: foodExpenseCategory.id,
        transactionDate: '2026-11-10',
        note: longNote,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Domain Unit Tests: transactionValidation (BR-01, BR-02, BR-03 with fixed clock)', () => {
  it('TEST-05 (BR-01 Unit): validateAmount checks exact boundaries and decimal restrictions', () => {
    expect(validateAmount(0).valid).toBe(false);
    expect(validateAmount(-10).valid).toBe(false);
    expect(validateAmount(-0.01).valid).toBe(false);
    expect(validateAmount(0.001).valid).toBe(false);
    expect(validateAmount(12.345).valid).toBe(false);
    expect(validateAmount(10000000).valid).toBe(false);
    expect(validateAmount(NaN).valid).toBe(false);
    expect(validateAmount('50').valid).toBe(false);

    // Valid lower boundary: 0.01 THB (1 satang)
    const minResult = validateAmount(0.01);
    expect(minResult.valid).toBe(true);
    expect(minResult.value?.amountSatang).toBe(1n);
    expect(minResult.value?.amountFormatted).toBe(0.01);

    // Valid upper boundary: 9,999,999.99 THB (999,999,999 satang)
    const maxResult = validateAmount(9999999.99);
    expect(maxResult.valid).toBe(true);
    expect(maxResult.value?.amountSatang).toBe(999999999n);
    expect(maxResult.value?.amountFormatted).toBe(9999999.99);

    // Standard valid amount: 120.50 THB (12050 satang)
    const stdResult = validateAmount(120.50);
    expect(stdResult.valid).toBe(true);
    expect(stdResult.value?.amountSatang).toBe(12050n);
    expect(stdResult.value?.amountFormatted).toBe(120.5);
  });

  it('TEST-06 (BR-02 Unit): validateCategoryMatch verifies type agreement and active status', () => {
    // Null / missing category
    expect(validateCategoryMatch('EXPENSE', null).valid).toBe(false);

    // Deactivated category
    expect(validateCategoryMatch('EXPENSE', { id: 'c1', type: 'EXPENSE', isActive: false }).valid).toBe(false);

    // Type mismatch
    expect(validateCategoryMatch('EXPENSE', { id: 'c2', type: 'INCOME', isActive: true }).valid).toBe(false);
    expect(validateCategoryMatch('INCOME', { id: 'c3', type: 'EXPENSE', isActive: true }).valid).toBe(false);

    // Valid match
    expect(validateCategoryMatch('EXPENSE', { id: 'c4', type: 'EXPENSE', isActive: true }).valid).toBe(true);
    expect(validateCategoryMatch('INCOME', { id: 'c5', type: 'INCOME', isActive: true }).valid).toBe(true);
  });

  it('TEST-07 (BR-03 Unit): validateTransactionDate enforces fixed-clock Asia/Bangkok midnight boundary', () => {
    // Fixed clock at 2026-11-14 20:30:00 UTC
    // In Asia/Bangkok (UTC+7), this is 2026-11-15 03:30:00 AM (already the next day in Thailand)
    const fixedClock = new Date('2026-11-14T20:30:00.000Z');

    // 2026-11-15 is today in Asia/Bangkok -> Accepted
    expect(validateTransactionDate('2026-11-15', fixedClock).valid).toBe(true);

    // 2026-11-14 is yesterday in Asia/Bangkok -> Accepted
    expect(validateTransactionDate('2026-11-14', fixedClock).valid).toBe(true);

    // 2026-11-16 is tomorrow in Asia/Bangkok -> Rejected
    const futureResult = validateTransactionDate('2026-11-16', fixedClock);
    expect(futureResult.valid).toBe(false);
    expect(futureResult.error).toContain('cannot be later than today');

    // Invalid format
    expect(validateTransactionDate('invalid-date', fixedClock).valid).toBe(false);
    expect(validateTransactionDate('2026-02-30', fixedClock).valid).toBe(false);
  });

  it('validateNote checks length restriction', () => {
    expect(validateNote(null).valid).toBe(true);
    expect(validateNote(undefined).valid).toBe(true);
    expect(validateNote('').valid).toBe(true);
    expect(validateNote('Valid note').valid).toBe(true);
    expect(validateNote('A'.repeat(200)).valid).toBe(true);
    expect(validateNote('A'.repeat(201)).valid).toBe(false);
  });
});
