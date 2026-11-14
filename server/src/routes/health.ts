import { Router, Request, Response } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();

// Liveness probe
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (verifies database connectivity per F-06 and deploy/smoke_test.py)
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      db: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Database unreachable',
      db: 'disconnected',
    });
  }
});
