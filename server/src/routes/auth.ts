import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      },
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        },
      });
    }

    // 8-hour session expiry (NFR-03 / SDS)
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // Signed HTTP-only cookie using SESSION_SECRET
    res.cookie('pocket48_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      signed: true,
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during login',
      },
    });
  }
});

// POST /api/auth/logout (guarded by requireAuth per system-sds.md Section 3.3)
authRouter.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const sessionId = req.sessionId || req.signedCookies?.pocket48_session || req.cookies?.pocket48_session;

  if (sessionId && typeof sessionId === 'string') {
    try {
      await prisma.session.deleteMany({
        where: { id: sessionId },
      });
    } catch {
      // Ignore if session row is already deleted
    }
  }

  res.clearCookie('pocket48_session', { path: '/' });

  return res.status(200).json({
    data: {
      message: 'Logged out successfully',
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      id: req.user!.id,
      email: req.user!.email,
      displayName: req.user!.displayName,
      role: req.user!.role,
    },
  });
});
