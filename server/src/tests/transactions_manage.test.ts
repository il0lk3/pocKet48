import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prisma } from '../db';

function getBangkokTomorrowDateString(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow);
}

describe('F-07a: Manage a Transaction API — View, Edit, Delete (TDD)', () => {
  const userAEmail = 'manage_user_a@pocket48.local';
  const userBEmail = 'manage_user_b@pocket48.local';
  const adminEmail = 'manage_admin@pocket48.local';
  const password = 'ManagePassword123!';

  const categoryNames = [
    'ManageTestFood',
    'ManageTestTransport',
    'ManageTestSalary',
    'ManageTestInactiveOwned',
    'ManageTestInactiveOther',
  ];

  let userAId = '';
  let userACookie = '';
  let userBCookie = '';
  let adminCookie = '';

  let foodCategoryId = '';
  let transportCategoryId = '';
  let salaryCategoryId = '';
  let inactiveOwnedCategoryId = '';
  let inactiveOtherCategoryId = '';

  let userATxId = '';
  let userAInactiveCatTxId = '';
  let userADeleteTxId = '';

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
        displayName: 'User A Manage Test',
        role: 'USER',
        isActive: true,
      },
    });
    userAId = userA.id;

    await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        displayName: 'User B Manage Test',
        role: 'USER',
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Admin Manage Test',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });

    const food = await prisma.category.create({
      data: { name: 'ManageTestFood', type: 'EXPENSE', isActive: true },
    });
    foodCategoryId = food.id;

    const transport = await prisma.category.create({
      data: { name: 'ManageTestTransport', type: 'EXPENSE', isActive: true },
    });
    transportCategoryId = transport.id;

    const salary = await prisma.category.create({
      data: { name: 'ManageTestSalary', type: 'INCOME', isActive: true },
    });
    salaryCategoryId = salary.id;

    const inactiveOwned = await prisma.category.create({
      data: { name: 'ManageTestInactiveOwned', type: 'EXPENSE', isActive: false },
    });
    inactiveOwnedCategoryId = inactiveOwned.id;

    const inactiveOther = await prisma.category.create({
      data: { name: 'ManageTestInactiveOther', type: 'EXPENSE', isActive: false },
    });
    inactiveOtherCategoryId = inactiveOther.id;

    const tx = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amountSatang: BigInt(12050),
        transactionDate: '2026-11-20',
        note: 'Initial lunch',
      },
    });
    userATxId = tx.id;

    const txInactiveCat = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: inactiveOwnedCategoryId,
        type: 'EXPENSE',
        amountSatang: BigInt(25000),
        transactionDate: '2026-11-18',
        note: 'Legacy category expense',
      },
    });
    userAInactiveCatTxId = txInactiveCat.id;

    const txToDelete = await prisma.transaction.create({
      data: {
        userId: userAId,
        categoryId: transportCategoryId,
        type: 'EXPENSE',
        amountSatang: BigInt(4500),
        transactionDate: '2026-11-19',
        note: 'BTS ticket to delete',
      },
    });
    userADeleteTxId = txToDelete.id;

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: userAEmail, password });
    userACookie =
      (loginA.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: userBEmail, password });
    userBCookie =
      (loginB.headers['set-cookie'] as string[]).find((c) =>
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

  it('TEST-20 (AC-07-01): GET /api/transactions/:id returns owner full transaction including categoryId, category.isActive, and updatedAt', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userATxId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: userATxId,
      amount: 120.5,
      amountSatang: 12050,
      type: 'EXPENSE',
      transactionDate: '2026-11-20',
      categoryId: foodCategoryId,
      note: 'Initial lunch',
      category: {
        id: foodCategoryId,
        name: 'ManageTestFood',
        type: 'EXPENSE',
        isActive: true,
      },
    });
    expect(typeof res.body.data.createdAt).toBe('string');
    expect(typeof res.body.data.updatedAt).toBe('string');
  });

  it('TEST-21 (AC-07-02): PUT /api/transactions/:id updates valid fields including boundaries 0.01 and 9999999.99 and persists to DB', async () => {
    // Lower boundary 0.01 THB (1 satang) + switch category
    const lowRes = await request(app)
      .put(`/api/transactions/${userATxId}`)
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 0.01,
        categoryId: transportCategoryId,
        transactionDate: '2026-11-21',
        note: 'Lower boundary update',
      });

    expect(lowRes.status).toBe(200);
    expect(lowRes.body.data).toMatchObject({
      id: userATxId,
      amount: 0.01,
      amountSatang: 1,
      type: 'EXPENSE',
      categoryId: transportCategoryId,
      transactionDate: '2026-11-21',
      note: 'Lower boundary update',
    });

    // Upper boundary 9,999,999.99 THB (999,999,999 satang) + switch type to INCOME
    const highRes = await request(app)
      .put(`/api/transactions/${userATxId}`)
      .set('Cookie', userACookie)
      .send({
        type: 'INCOME',
        amount: 9999999.99,
        categoryId: salaryCategoryId,
        transactionDate: '2026-11-22',
        note: 'Upper boundary salary',
      });

    expect(highRes.status).toBe(200);
    expect(highRes.body.data).toMatchObject({
      id: userATxId,
      amount: 9999999.99,
      amountSatang: 999999999,
      type: 'INCOME',
      categoryId: salaryCategoryId,
      transactionDate: '2026-11-22',
      note: 'Upper boundary salary',
    });

    // Restore baseline value for subsequent tests and verify DB persistence
    const restoreRes = await request(app)
      .put(`/api/transactions/${userATxId}`)
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 120.5,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
        note: 'Initial lunch',
      });
    expect(restoreRes.status).toBe(200);

    const dbRow = await prisma.transaction.findUnique({ where: { id: userATxId } });
    expect(dbRow?.amountSatang).toBe(BigInt(12050));
    expect(dbRow?.categoryId).toBe(foodCategoryId);
    expect(dbRow?.type).toBe('EXPENSE');
  });

  it('TEST-22 (AC-07-02 / D-07): PUT /api/transactions/:id allows editing with unchanged deactivated category but rejects changing to a different inactive category', async () => {
    // Allowed: categoryId unchanged (even though inactive)
    const allowRes = await request(app)
      .put(`/api/transactions/${userAInactiveCatTxId}`)
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 275.5,
        categoryId: inactiveOwnedCategoryId,
        transactionDate: '2026-11-18',
        note: 'Edited with unchanged deactivated category',
      });

    expect(allowRes.status).toBe(200);
    expect(allowRes.body.data).toMatchObject({
      id: userAInactiveCatTxId,
      amount: 275.5,
      amountSatang: 27550,
      categoryId: inactiveOwnedCategoryId,
      note: 'Edited with unchanged deactivated category',
      category: {
        id: inactiveOwnedCategoryId,
        isActive: false,
      },
    });

    // Rejected: changing to a different deactivated category
    const rejectRes = await request(app)
      .put(`/api/transactions/${userAInactiveCatTxId}`)
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 300.0,
        categoryId: inactiveOtherCategoryId,
        transactionDate: '2026-11-18',
        note: 'Should fail switching inactive category',
      });

    expect(rejectRes.status).toBe(400);
    expect(rejectRes.body.error.code).toBe('VALIDATION_ERROR');

    // Confirm DB unchanged after rejected edit
    const dbRow = await prisma.transaction.findUnique({
      where: { id: userAInactiveCatTxId },
    });
    expect(dbRow?.amountSatang).toBe(BigInt(27550));
    expect(dbRow?.categoryId).toBe(inactiveOwnedCategoryId);
  });

  it('TEST-23 (AC-07-03): PUT /api/transactions/:id rejects invalid amounts, future date, mismatched category type, and long note leaving DB unchanged', async () => {
    const tomorrowBangkok = getBangkokTomorrowDateString();

    const invalidPayloads = [
      {
        type: 'EXPENSE',
        amount: 0,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
      },
      {
        type: 'EXPENSE',
        amount: -10,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
      },
      {
        type: 'EXPENSE',
        amount: 1.234,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
      },
      {
        type: 'EXPENSE',
        amount: 10000000,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
      },
      {
        type: 'EXPENSE',
        amount: 50,
        categoryId: foodCategoryId,
        transactionDate: tomorrowBangkok,
      },
      {
        type: 'EXPENSE',
        amount: 50,
        categoryId: salaryCategoryId, // INCOME category for EXPENSE
        transactionDate: '2026-11-20',
      },
      {
        type: 'EXPENSE',
        amount: 50,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
        note: 'x'.repeat(201),
      },
    ];

    for (const payload of invalidPayloads) {
      const res = await request(app)
        .put(`/api/transactions/${userATxId}`)
        .set('Cookie', userACookie)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }

    // Verify DB record remained completely unmodified
    const dbRow = await prisma.transaction.findUnique({ where: { id: userATxId } });
    expect(dbRow?.amountSatang).toBe(BigInt(12050));
    expect(dbRow?.categoryId).toBe(foodCategoryId);
    expect(dbRow?.transactionDate).toBe('2026-11-20');
    expect(dbRow?.note).toBe('Initial lunch');
  });

  it('TEST-24 (AC-07-04): Another user receives 404 on GET, PUT, and DELETE without disclosing or modifying owner data (BR-04, D-04)', async () => {
    const getRes = await request(app)
      .get(`/api/transactions/${userATxId}`)
      .set('Cookie', userBCookie);
    expect(getRes.status).toBe(404);
    expect(getRes.body.data).toBeUndefined();

    const putRes = await request(app)
      .put(`/api/transactions/${userATxId}`)
      .set('Cookie', userBCookie)
      .send({
        type: 'EXPENSE',
        amount: 999.99,
        categoryId: foodCategoryId,
        transactionDate: '2026-11-20',
        note: 'Tampered by User B',
      });
    expect(putRes.status).toBe(404);
    expect(putRes.body.data).toBeUndefined();

    const delRes = await request(app)
      .delete(`/api/transactions/${userATxId}`)
      .set('Cookie', userBCookie);
    expect(delRes.status).toBe(404);

    // Owner record must still exist intact
    const dbRow = await prisma.transaction.findUnique({ where: { id: userATxId } });
    expect(dbRow).not.toBeNull();
    expect(dbRow?.amountSatang).toBe(BigInt(12050));
    expect(dbRow?.note).toBe('Initial lunch');
  });

  it('TEST-25 (AC-07-05): DELETE /api/transactions/:id permanently deletes owner transaction; subsequent GET returns 404 and list omits it', async () => {
    const delRes = await request(app)
      .delete(`/api/transactions/${userADeleteTxId}`)
      .set('Cookie', userACookie);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data).toEqual({
      id: userADeleteTxId,
      deleted: true,
    });

    const getAfter = await request(app)
      .get(`/api/transactions/${userADeleteTxId}`)
      .set('Cookie', userACookie);
    expect(getAfter.status).toBe(404);

    const listAfter = await request(app)
      .get('/api/transactions')
      .set('Cookie', userACookie);
    expect(listAfter.status).toBe(200);
    const ids = listAfter.body.data.map((t: { id: string }) => t.id);
    expect(ids).not.toContain(userADeleteTxId);

    // Deleting a second time returns 404
    const delAgain = await request(app)
      .delete(`/api/transactions/${userADeleteTxId}`)
      .set('Cookie', userACookie);
    expect(delAgain.status).toBe(404);
  });

  it('TEST-26 (AC-07-06): Anonymous requests return 401 and Administrator requests return 403 on GET, PUT, and DELETE', async () => {
    // Anonymous -> 401
    expect((await request(app).get(`/api/transactions/${userATxId}`)).status).toBe(401);
    expect(
      (
        await request(app)
          .put(`/api/transactions/${userATxId}`)
          .send({
            type: 'EXPENSE',
            amount: 10,
            categoryId: foodCategoryId,
            transactionDate: '2026-11-20',
          })
      ).status
    ).toBe(401);
    expect((await request(app).delete(`/api/transactions/${userATxId}`)).status).toBe(401);

    // Administrator -> 403 (BR-07)
    expect(
      (
        await request(app)
          .get(`/api/transactions/${userATxId}`)
          .set('Cookie', adminCookie)
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(`/api/transactions/${userATxId}`)
          .set('Cookie', adminCookie)
          .send({
            type: 'EXPENSE',
            amount: 10,
            categoryId: foodCategoryId,
            transactionDate: '2026-11-20',
          })
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .delete(`/api/transactions/${userATxId}`)
          .set('Cookie', adminCookie)
      ).status
    ).toBe(403);

    // Confirm record untouched
    const dbRow = await prisma.transaction.findUnique({ where: { id: userATxId } });
    expect(dbRow?.amountSatang).toBe(BigInt(12050));
  });
});
