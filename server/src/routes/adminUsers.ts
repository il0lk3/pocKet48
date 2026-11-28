import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireRole } from '../middleware/auth';

export const adminUsersRouter = Router();

// All account administration routes require ADMINISTRATOR role (BR-10, AC-11-05)
adminUsersRouter.use(requireRole(['ADMINISTRATOR']));

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

// GET /api/admin/users — List all user accounts without passwordHash (F-11, FR-14, NFR-02, AC-11-01)
adminUsersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
      select: SAFE_USER_SELECT,
    });

    return res.status(200).json({
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user accounts',
      },
    });
  }
});

// PATCH /api/admin/users/:id — Activate or deactivate a user account (F-11, FR-14, BR-06, D-09, D-11)
adminUsersRouter.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body || {};

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field "isActive" must be a boolean.',
      },
    });
  }

  // Decision D-11: Prevent Administrator self-deactivation lock-out
  if (id === req.user!.id && isActive === false) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Administrators cannot deactivate their own account.',
      },
    });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!target) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User account not found',
        },
      });
    }

    // BR-06 / D-09: When deactivating, atomically revoke all active sessions for that user
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { isActive },
        select: SAFE_USER_SELECT,
      });

      if (!isActive) {
        await tx.session.deleteMany({
          where: { userId: id },
        });
      }

      return updated;
    });

    return res.status(200).json({
      data: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    });
  } catch {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user account status',
      },
    });
  }
});
