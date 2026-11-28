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

// GET /api/transactions — List user's own transactions (F-03, AC-03-01, AC-03-02, TEST-08, TEST-15)
transactionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: [
        { transactionDate: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amountSatang) / 100,
      amountSatang: Number(tx.amountSatang),
      type: tx.type,
      transactionDate: tx.transactionDate,
      categoryId: tx.categoryId,
      category: tx.category,
      note: tx.note,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      data: formatted,
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve transactions',
      },
    });
  }
});

// GET /api/transactions/:id — Retrieve own transaction in full (FR-08, BR-04, AC-05-02, TEST-09)
transactionsRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    // Isolation: If transaction does not exist or belongs to another user, return 404 (BR-04, D-04)
    if (!transaction) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    }

    return res.status(200).json({
      data: {
        id: transaction.id,
        amount: Number(transaction.amountSatang) / 100,
        amountSatang: Number(transaction.amountSatang),
        type: transaction.type,
        transactionDate: transaction.transactionDate,
        categoryId: transaction.categoryId,
        category: transaction.category,
        note: transaction.note,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve transaction',
      },
    });
  }
});

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

// PUT /api/transactions/:id — Edit owner's transaction (F-07a, FR-09, AC-07-02..AC-07-04, D-07)
transactionsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, amount, categoryId, transactionDate, note } = req.body || {};

  try {
    // 1. Check existence & ownership first (BR-04, D-04: never disclose foreign ID existence)
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    }

    // 2. Validate Transaction Type
    if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction type must be INCOME or EXPENSE.',
        },
      });
    }

    // 3. Validate Amount (BR-01)
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid || !amountValidation.value) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: amountValidation.error || 'Invalid amount.',
        },
      });
    }

    // 4. Validate Transaction Date (BR-03)
    const dateValidation = validateTransactionDate(transactionDate);
    if (!dateValidation.valid || !dateValidation.value) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: dateValidation.error || 'Invalid transaction date.',
        },
      });
    }

    // 5. Validate Category ID and match with type (BR-02 + D-07: allow inactive only if unchanged)
    if (typeof categoryId !== 'string' || !categoryId.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category ID is required.',
        },
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId.trim() },
    });

    const isUnchangedCategory = category !== null && category.id === existing.categoryId;
    const categoryValidation = validateCategoryMatch(type, category, {
      allowInactive: isUnchangedCategory,
    });
    if (!categoryValidation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: categoryValidation.error || 'Invalid category.',
        },
      });
    }

    // 6. Validate Note
    const noteValidation = validateNote(note);
    if (!noteValidation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: noteValidation.error || 'Invalid note.',
        },
      });
    }

    // 7. Persist update atomically (integer satang storage per D-03 / NFR-07)
    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        type,
        categoryId: category!.id,
        amountSatang: amountValidation.value.amountSatang,
        transactionDate: dateValidation.value,
        note: noteValidation.value ?? null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    return res.status(200).json({
      data: {
        id: updated.id,
        amount: amountValidation.value.amountFormatted,
        amountSatang: Number(updated.amountSatang),
        type: updated.type,
        transactionDate: updated.transactionDate,
        categoryId: updated.categoryId,
        category: updated.category,
        note: updated.note,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update transaction',
      },
    });
  }
});

// DELETE /api/transactions/:id — Permanently delete owner's transaction (F-07a, FR-10, AC-07-04..06, D-05)
transactionsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await prisma.transaction.deleteMany({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    }

    return res.status(200).json({
      data: {
        id,
        deleted: true,
      },
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete transaction',
      },
    });
  }
});
