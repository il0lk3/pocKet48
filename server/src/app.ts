import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { authenticateSession, requireRole } from './middleware/auth';

// BigInt JSON serialization polyfill
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const app = express();

app.use(express.json());

// Signed cookies using SESSION_SECRET from environment (SDS Section 4.1)
const sessionSecret = process.env.SESSION_SECRET || 'dev-pocket48-session-secret-at-least-32-chars';
app.use(cookieParser(sessionSecret));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Session resolution middleware (populates req.user from signed cookie if valid)
app.use(authenticateSession);

// Mount API routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);

// Enforce role restriction on transaction routes (BR-07 / AC-05-03 / NFR-01)
app.use('/api/transactions', requireRole(['USER']));

// In production, serve built frontend static files if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
