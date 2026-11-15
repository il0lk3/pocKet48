import { Router, Request, Response } from 'express';
import { TransactionType } from '@prisma/client';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const categoriesRouter = Router();

// GET /api/categories — List active categories (any authenticated user: USER or ADMINISTRATOR)
categoriesRouter.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
      },
    });

    return res.status(200).json({
      data: categories,
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve categories',
      },
    });
  }
});

// POST /api/categories — Create a new category (ADMINISTRATOR only)
categoriesRouter.post(
  '/',
  requireRole(['ADMINISTRATOR']),
  async (req: Request, res: Response) => {
    const { name, type } = req.body || {};

    if (typeof name !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required and must be between 1 and 40 characters.',
        },
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 40) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name must be between 1 and 40 characters.',
        },
      });
    }

    if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category type must be INCOME or EXPENSE.',
        },
      });
    }

    try {
      // BR-05 / AC-04-02: Case-insensitive uniqueness within the same type
      const existing = await prisma.category.findFirst({
        where: {
          type,
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Category "${trimmedName}" already exists under ${type}.`,
          },
        });
      }

      const category = await prisma.category.create({
        data: {
          name: trimmedName,
          type,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
        },
      });

      return res.status(201).json({
        data: category,
      });
    } catch {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create category',
        },
      });
    }
  }
);
