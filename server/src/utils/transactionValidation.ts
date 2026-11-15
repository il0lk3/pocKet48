import { TransactionType } from '@prisma/client';

export interface ValidationResult<T = void> {
  valid: boolean;
  error?: string;
  value?: T;
}

/**
 * Validates transaction amount per BR-01:
 * - Must be greater than 0
 * - At most 2 decimal places
 * - Maximum 9,999,999.99 THB
 * - Converts to integer satang (BigInt)
 */
export function validateAmount(amount: unknown): ValidationResult<{ amountSatang: bigint; amountFormatted: number }> {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || Number.isNaN(amount)) {
    return {
      valid: false,
      error: 'Transaction amount must be a valid positive number.',
    };
  }

  // Check decimal places (at most 2 decimals)
  const amountStr = amount.toString();
  if (amountStr.includes('.')) {
    const decimals = amountStr.split('.')[1];
    if (decimals && decimals.length > 2) {
      return {
        valid: false,
        error: 'Transaction amount cannot have more than 2 decimal places.',
      };
    }
  }

  // Minimum 0.01 THB (1 satang) and maximum 9,999,999.99 THB (999,999,999 satang)
  if (amount < 0.01 || amount > 9999999.99) {
    return {
      valid: false,
      error: 'Transaction amount must be between 0.01 and 9,999,999.99 THB.',
    };
  }

  const satang = BigInt(Math.round(amount * 100));
  if (satang < 1n || satang > 999999999n) {
    return {
      valid: false,
      error: 'Transaction amount out of acceptable bounds.',
    };
  }

  return {
    valid: true,
    value: {
      amountSatang: satang,
      amountFormatted: Number(satang) / 100,
    },
  };
}

/**
 * Validates transaction date per BR-03:
 * - Must be format YYYY-MM-DD
 * - Must be valid calendar date
 * - Cannot be later than today in Asia/Bangkok (UTC+7)
 */
export function validateTransactionDate(dateStr: unknown, now: Date = new Date()): ValidationResult<string> {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      valid: false,
      error: 'Transaction date must be in YYYY-MM-DD format.',
    };
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      valid: false,
      error: 'Transaction date is not a valid calendar date.',
    };
  }

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      valid: false,
      error: 'Transaction date is not a valid calendar date.',
    };
  }

  // Compare against today in Asia/Bangkok
  const todayBangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
  if (dateStr > todayBangkok) {
    return {
      valid: false,
      error: `Transaction date cannot be later than today (${todayBangkok}) in Asia/Bangkok.`,
    };
  }

  return {
    valid: true,
    value: dateStr,
  };
}

/**
 * Validates category match per BR-02:
 * - Category must exist
 * - Category must be active
 * - Category type must equal transaction type
 */
export function validateCategoryMatch(
  txType: TransactionType,
  category: { id: string; type: TransactionType; isActive: boolean } | null
): ValidationResult {
  if (!category) {
    return {
      valid: false,
      error: 'Category not found.',
    };
  }

  if (!category.isActive) {
    return {
      valid: false,
      error: 'Category is deactivated.',
    };
  }

  if (category.type !== txType) {
    return {
      valid: false,
      error: `Transaction type ${txType} does not match category type ${category.type}.`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validates optional note (max 200 characters)
 */
export function validateNote(note: unknown): ValidationResult<string | null> {
  if (note === undefined || note === null || note === '') {
    return {
      valid: true,
      value: null,
    };
  }

  if (typeof note !== 'string') {
    return {
      valid: false,
      error: 'Note must be a string.',
    };
  }

  if (note.length > 200) {
    return {
      valid: false,
      error: 'Note cannot exceed 200 characters.',
    };
  }

  return {
    valid: true,
    value: note,
  };
}
