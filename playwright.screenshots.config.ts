import { defineConfig } from '@playwright/test';

/** `npm run docs:screenshots` — regenerates docs/screenshots from a real, isolated instance. See docs/screenshots/README.md. */
export default defineConfig({
  testDir: './tests/screenshots',
  fullyParallel: false,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3002',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    deviceScaleFactor: 1,
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
      args: process.env.PLAYWRIGHT_EXTRA_ARGS ? JSON.parse(process.env.PLAYWRIGHT_EXTRA_ARGS) : [],
    } : undefined,
  },
  webServer: {
    command: 'node scripts/capture-server.mjs',
    url: 'http://localhost:3002/api/health',
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
