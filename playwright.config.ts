import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
    // Uses the existing Chrome installation; override for Playwright Chromium.
    channel: process.env['PLAYWRIGHT_CHANNEL'] || 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx astro preview --host 127.0.0.1 --port 4322',
    // Astro 7 auto-backgrounds agent commands; keep this child attached to the runner.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
  },
});
