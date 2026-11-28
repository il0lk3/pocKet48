/**
 * TEST-39 (AC-09-07 / NFR-04): Timing benchmark with 1,000 transactions for one user.
 * Target: 95th-percentile (p95) response time <= 500 ms for both
 * GET /api/transactions and GET /api/summary?month=2026-11.
 */
import dotenv from 'dotenv';
dotenv.config();

import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db';

const BENCH_EMAIL = 'nfr04_benchmark_user@pocket48.local';
const BENCH_PASSWORD = 'BenchmarkPassword123!';
const BENCH_CATEGORIES = ['BenchFood', 'BenchTransport', 'BenchUtilities', 'BenchSalary'];
const TOTAL_ROWS = 1000;
const ITERATIONS = 30;
const TARGET_P95_MS = 500;

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function summarizeTimings(label: string, samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0];
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const max = sorted[sorted.length - 1];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  console.log(
    `[NFR-04] ${label} (n=${samples.length}, rows=${TOTAL_ROWS}): ` +
      `min=${min.toFixed(2)}ms | p50=${p50.toFixed(2)}ms | p95=${p95.toFixed(2)}ms | ` +
      `max=${max.toFixed(2)}ms | mean=${mean.toFixed(2)}ms | target<=${TARGET_P95_MS}ms -> ` +
      `${p95 <= TARGET_P95_MS ? 'PASS' : 'FAIL'}`
  );
  return { min, p50, p95, max, mean };
}

async function cleanup() {
  await prisma.transaction.deleteMany({
    where: { user: { email: BENCH_EMAIL } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: BENCH_EMAIL } },
  });
  await prisma.user.deleteMany({
    where: { email: BENCH_EMAIL },
  });
  await prisma.category.deleteMany({
    where: { name: { in: BENCH_CATEGORIES } },
  });
}

async function main() {
  await cleanup();
  try {
    const passwordHash = await bcrypt.hash(BENCH_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: BENCH_EMAIL,
        passwordHash,
        displayName: 'NFR-04 Benchmark User',
        role: 'USER',
        isActive: true,
      },
    });

    const food = await prisma.category.create({
      data: { name: 'BenchFood', type: 'EXPENSE', isActive: true },
    });
    const transport = await prisma.category.create({
      data: { name: 'BenchTransport', type: 'EXPENSE', isActive: true },
    });
    const utilities = await prisma.category.create({
      data: { name: 'BenchUtilities', type: 'EXPENSE', isActive: true },
    });
    const salary = await prisma.category.create({
      data: { name: 'BenchSalary', type: 'INCOME', isActive: true },
    });

    const expenseCats = [food.id, transport.id, utilities.id];
    const batch = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const isIncome = i % 10 === 0;
      batch.push({
        userId: user.id,
        categoryId: isIncome ? salary.id : expenseCats[i % expenseCats.length],
        type: isIncome ? ('INCOME' as const) : ('EXPENSE' as const),
        amountSatang: BigInt(1000 + (i % 500) * 25),
        transactionDate: `2026-11-${day}`,
        note: `Benchmark row #${i + 1}`,
      });
    }
    await prisma.transaction.createMany({ data: batch });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: BENCH_EMAIL, password: BENCH_PASSWORD });
    if (loginRes.status !== 200) {
      throw new Error(`Benchmark login failed with status ${loginRes.status}`);
    }
    const cookie =
      (loginRes.headers['set-cookie'] as string[]).find((c) =>
        c.startsWith('pocket48_session=')
      ) || '';

    // Warm up 2 requests
    await request(app).get('/api/transactions').set('Cookie', cookie);
    await request(app).get('/api/summary?month=2026-11').set('Cookie', cookie);

    const listTimings: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await request(app).get('/api/transactions').set('Cookie', cookie);
      const elapsed = performance.now() - t0;
      if (res.status !== 200 || res.body.data.length !== TOTAL_ROWS) {
        throw new Error(`Unexpected list response: status=${res.status}, count=${res.body.data?.length}`);
      }
      listTimings.push(elapsed);
    }

    const summaryTimings: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await request(app).get('/api/summary?month=2026-11').set('Cookie', cookie);
      const elapsed = performance.now() - t0;
      if (res.status !== 200 || res.body.data.month !== '2026-11') {
        throw new Error(`Unexpected summary response: status=${res.status}`);
      }
      summaryTimings.push(elapsed);
    }

    const listStats = summarizeTimings('GET /api/transactions', listTimings);
    const summaryStats = summarizeTimings('GET /api/summary?month=2026-11', summaryTimings);

    if (listStats.p95 > TARGET_P95_MS || summaryStats.p95 > TARGET_P95_MS) {
      process.exitCode = 1;
    }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
