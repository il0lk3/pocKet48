import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db';

describe('Health & Readiness Probes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health returns 200 and liveness payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/ready returns 200 and connected status when database is reachable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }] as any);
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.db).toBe('connected');
  });

  it('GET /api/ready returns 503 and disconnected status when database is unreachable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Database unreachable');
    expect(res.body.db).toBe('disconnected');
  });
});
