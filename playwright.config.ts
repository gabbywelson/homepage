import { defineConfig } from '@playwright/test';

const port = Number(process.env['PLAYWRIGHT_PORT'] || 4322);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be a valid TCP port.');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  reporter: 'list',
  use: {
    baseURL,
    // Uses the existing Chrome installation; override for Playwright Chromium.
    channel: process.env['PLAYWRIGHT_CHANNEL'] || 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `bunx astro preview --host 127.0.0.1 --port ${port}`,
    // Astro 7 auto-backgrounds agent commands; keep this child attached to the runner.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    url: baseURL,
    reuseExistingServer: false,
  },
});
