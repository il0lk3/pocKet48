import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { healthRouter } from './routes/health';

// BigInt JSON serialization polyfill
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const app = express();

app.use(express.json());
app.use(cookieParser());

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Mount health routes under /api
app.use('/api', healthRouter);

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
