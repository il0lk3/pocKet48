import { TransactionType } from '@prisma/client';

export interface MonthRange {
  month: string;
  startDate: string;
  endDate: string;
}

export interface MonthValidationResult {
  valid: boolean;
  error?: string;
  value?: MonthRange;
}

export interface SummaryTransactionRow {
  type: TransactionType;
  amountSatang: bigint;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export interface CategoryExpenseBreakdown {
  categoryId: string;
  categoryName: string;
  totalSatang: number;
  total: number;
  transactionCount: number;
}

export interface MonthlySummaryData {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalIncomeSatang: number;
  totalExpenseSatang: number;
  balanceSatang: number;
  expenseByCategory: CategoryExpenseBreakdown[];
}

/**
 * Validates YYYY-MM month query parameter and returns exact calendar bounds (D-10).
 */
export function validateMonthParam(month: unknown): MonthValidationResult {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return {
      valid: false,
      error: 'Month must be in YYYY-MM format (e.g., 2026-11).',
    };
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();

  return {
    valid: true,
    value: {
      month,
      startDate: `${month}-01`,
      endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
    },
  };
}

/**
 * Converts integer satang to an exact 2-decimal THB string without floating-point arithmetic (NFR-07).
 */
export function formatSatangToTHB(satang: bigint): string {
  const negative = satang < 0n;
  const abs = negative ? -satang : satang;
  const baht = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${baht.toString()}.${frac}`;
}

/**
 * Converts integer satang to an exact decimal number via exact string parsing (zero IEEE-754 drift).
 */
export function satangToExactNumber(satang: bigint): number {
  return Number(formatSatangToTHB(satang));
}

/**
 * Computes monthly totals, derived balance (BR-08), and per-category expense totals
 * strictly in BigInt satang (D-03, NFR-07).
 */
export function computeMonthlySummary(
  month: string,
  rows: SummaryTransactionRow[]
): MonthlySummaryData {
  let totalIncomeSatang = 0n;
  let totalExpenseSatang = 0n;

  const byCategory = new Map<
    string,
    { categoryId: string; categoryName: string; totalSatang: bigint; transactionCount: number }
  >();

  for (const row of rows) {
    if (row.type === TransactionType.INCOME) {
      totalIncomeSatang += row.amountSatang;
    } else if (row.type === TransactionType.EXPENSE) {
      totalExpenseSatang += row.amountSatang;
      const existing = byCategory.get(row.categoryId);
      if (existing) {
        existing.totalSatang += row.amountSatang;
        existing.transactionCount += 1;
      } else {
        byCategory.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.category.name,
          totalSatang: row.amountSatang,
          transactionCount: 1,
        });
      }
    }
  }

  const balanceSatang = totalIncomeSatang - totalExpenseSatang;

  const expenseByCategory: CategoryExpenseBreakdown[] = Array.from(byCategory.values())
    .sort((a, b) => {
      if (b.totalSatang > a.totalSatang) return 1;
      if (b.totalSatang < a.totalSatang) return -1;
      return a.categoryName.localeCompare(b.categoryName);
    })
    .map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalSatang: Number(item.totalSatang),
      total: satangToExactNumber(item.totalSatang),
      transactionCount: item.transactionCount,
    }));

  return {
    month,
    totalIncome: satangToExactNumber(totalIncomeSatang),
    totalExpense: satangToExactNumber(totalExpenseSatang),
    balance: satangToExactNumber(balanceSatang),
    totalIncomeSatang: Number(totalIncomeSatang),
    totalExpenseSatang: Number(totalExpenseSatang),
    balanceSatang: Number(balanceSatang),
    expenseByCategory,
  };
}
