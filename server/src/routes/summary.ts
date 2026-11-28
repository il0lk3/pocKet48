import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireRole } from '../middleware/auth';
import {
  computeMonthlySummary,
  validateMonthParam,
} from '../utils/summaryCalculation';

export const summaryRouter = Router();

// Monthly summary requires authenticated USER (BR-07, AC-09-04)
summaryRouter.use(requireRole(['USER']));

// GET /api/summary?month=YYYY-MM — Monthly totals & expense breakdown (F-09a, FR-12, BR-08, NFR-07)
summaryRouter.get('/', async (req: Request, res: Response) => {
  const monthValidation = validateMonthParam(req.query.month);
  if (!monthValidation.valid || !monthValidation.value) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: monthValidation.error || 'Month must be in YYYY-MM format.',
      },
    });
  }

  const { month, startDate, endDate } = monthValidation.value;

  try {
    const rows = await prisma.transaction.findMany({
      where: {
        userId: req.user!.id,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amountSatang: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const summary = computeMonthlySummary(month, rows);

    return res.status(200).json({
      data: summary,
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to compute monthly summary',
      },
    });
  }
});
