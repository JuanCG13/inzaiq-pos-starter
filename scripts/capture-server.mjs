/**
 * Starts an isolated, non-demo instance for documentation screenshots: fresh SQLite file, real Better Auth sign-up,
 * random secret generated per run, nothing read from or written to .env.local. Used by playwright.screenshots.config.ts.
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rmSync } from 'node:fs';

const port = process.env.CAPTURE_PORT ?? '3002';
const origin = `http://localhost:${port}`;
for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(`screenshots.db${suffix}`, { force: true });
const env = {
  ...process.env, NODE_ENV: 'development', DATABASE_PROVIDER: 'sqlite', DATABASE_URL: 'file:./screenshots.db',
  APP_URL: origin, BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: randomBytes(32).toString('base64url'),
  DEMO_MODE: 'false', STORE_TENANT_ID: '', LOG_LEVEL: 'warn', NEXT_TELEMETRY_DISABLED: '1', NEXT_DEV_INDICATORS: 'false',
};
for (const script of [['db-migrate.ts'], ['auth-migrate.ts', '--apply']]) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', `scripts/${script[0]}`, ...script.slice(1)], { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', port, '--hostname', 'localhost', '--webpack'], { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
