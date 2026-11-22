import { Router, Request, Response } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();

const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const APP_COMMIT_SHA = process.env.APP_COMMIT_SHA || 'dev';

// Liveness probe (exposes deployed version and commit SHA for release verification)
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    version: APP_VERSION,
    commit: APP_COMMIT_SHA,
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
