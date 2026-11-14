import { Router, Request, Response } from 'express';
import { TransactionType } from '@prisma/client';
import { prisma } from '../db';
import { requireRole } from '../middleware/auth';
import {
  validateAmount,
  validateTransactionDate,
  validateCategoryMatch,
  validateNote,
} from '../utils/transactionValidation';

export const transactionsRouter = Router();

// Transactions routes require authenticated USER (AC-05-03, BR-07)
transactionsRouter.use(requireRole(['USER']));

// POST /api/transactions — Record a new transaction (F-02, AC-02-01 to AC-02-04)
transactionsRouter.post('/', async (req: Request, res: Response) => {
  const { type, amount, categoryId, transactionDate, note } = req.body || {};

  // 1. Validate Transaction Type
  if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Transaction type must be INCOME or EXPENSE.',
      },
    });
  }

  // 2. Validate Amount (BR-01, AC-02-02)
  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid || !amountValidation.value) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: amountValidation.error || 'Invalid amount.',
      },
    });
  }

  // 3. Validate Transaction Date (BR-03, AC-02-04)
  const dateValidation = validateTransactionDate(transactionDate);
  if (!dateValidation.valid || !dateValidation.value) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: dateValidation.error || 'Invalid transaction date.',
      },
    });
  }

  // 4. Validate Category ID and match with type (BR-02, AC-02-03)
  if (typeof categoryId !== 'string' || !categoryId.trim()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Category ID is required.',
      },
    });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId.trim() },
    });

    const categoryValidation = validateCategoryMatch(type, category);
    if (!categoryValidation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: categoryValidation.error || 'Invalid category.',
        },
      });
    }

    // 5. Validate Note
    const noteValidation = validateNote(note);
    if (!noteValidation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: noteValidation.error || 'Invalid note.',
        },
      });
    }

    // 6. Create Transaction (Integer satang storage per D-03 / NFR-07)
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        categoryId: category!.id,
        type,
        amountSatang: amountValidation.value.amountSatang,
        transactionDate: dateValidation.value,
        note: noteValidation.value ?? null,
      },
    });

    return res.status(201).json({
      data: {
        id: transaction.id,
        amount: amountValidation.value.amountFormatted,
        amountSatang: Number(transaction.amountSatang),
        type: transaction.type,
        transactionDate: transaction.transactionDate,
        categoryId: transaction.categoryId,
        note: transaction.note,
        createdAt: transaction.createdAt.toISOString(),
      },
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to record transaction',
      },
    });
  }
});
