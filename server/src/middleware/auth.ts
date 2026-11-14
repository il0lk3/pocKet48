import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

// Session resolution middleware
export async function authenticateSession(req: Request, _res: Response, next: NextFunction) {
  const sessionId = req.cookies?.pocket48_session;
  if (!sessionId || typeof sessionId !== 'string') {
    return next();
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return next();
    }

    // Check expiration (8 hours)
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      return next();
    }

    // Check user active status
    if (!session.user.isActive) {
      return next();
    }

    req.sessionId = session.id;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role,
      isActive: session.user.isActive,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Route guard requiring authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  next();
}

// Route guard requiring specific role(s)
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions',
        },
      });
    }

    next();
  };
}
