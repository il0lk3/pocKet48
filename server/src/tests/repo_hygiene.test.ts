import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../..');

describe('F-06: Repository Hygiene & Zero Committed Secrets (TDD)', () => {
  it('TEST-18 (AC-06-02): .env files are not tracked in git and .env.example contains only safe placeholders', () => {
    const trackedFiles = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // Ensure no actual .env file is committed (only .env.example is allowed)
    const committedEnvFiles = trackedFiles.filter(
      (file) =>
        (file === '.env' || file.endsWith('/.env') || file.includes('.env.local')) &&
        !file.endsWith('.env.example')
    );
    expect(committedEnvFiles).toEqual([]);

    // Ensure server/.env.example is tracked and uses placeholder values only
    expect(trackedFiles).toContain('server/.env.example');
    const envExamplePath = path.join(repoRoot, 'server/.env.example');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

    expect(envExampleContent).toContain('DATABASE_URL=');
    expect(envExampleContent).toContain('SESSION_SECRET=');
    expect(envExampleContent).not.toMatch(/AIza[0-9A-Za-z-_]{35}/);
    expect(envExampleContent).not.toMatch(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/);
  });

  it('DELIBERATE FAILURE (Issue #20 / C-02): prove required-check merge gate blocks failing PRs', () => {
    expect(true).toBe(false);
  });
});
