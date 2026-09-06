// @ts-check
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const { values, positionals } = parseArgs({
  options: { desktop: { type: 'boolean', default: false } },
  allowPositionals: true,
});
const routes = positionals.length
  ? positionals
  : ['/', '/blog/', '/resume/', '/garden/', '/uses/', '/blog/coming-out/'];
const origin = 'http://127.0.0.1:4324';
if (
  routes.some((route) => {
    const url = new URL(route, origin);
    return (
      !route.startsWith('/') ||
      route.includes('\\') ||
      url.origin !== origin ||
      Boolean(url.search || url.hash)
    );
  })
) {
  throw new Error('Pass local route paths, such as / or /uses/.');
}

const profile = values.desktop ? 'desktop' : 'mobile';
const outputDirectory = new URL('../lighthouse-report/', import.meta.url);
const preview = spawn(
  process.execPath,
  [
    'node_modules/astro/bin/astro.mjs',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4324',
  ],
  {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let previewLogs = '';
preview.stdout.on('data', (chunk) => {
  previewLogs += String(chunk);
});
preview.stderr.on('data', (chunk) => {
  previewLogs += String(chunk);
});
/** @type {Error | undefined} */
let previewError;
preview.on('error', (error) => {
  previewError = error;
});
/** @type {Awaited<ReturnType<typeof launch>> | undefined} */
let chrome;
/** @type {Array<Record<string, string | number | null>>} */
const summaries = [];

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (previewError) throw previewError;
    if (preview.exitCode !== null)
      throw new Error(`Preview failed: ${previewLogs}`);
    // Readiness must come from this child, so an unrelated server is never audited.
    if (previewLogs.includes(origin)) {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1000),
      }).catch(() => null);
      if (response?.ok) {
        ready = true;
        break;
      }
    }
    await delay(100);
  }
  if (!ready) throw new Error(`Preview did not become ready: ${previewLogs}`);
  await mkdir(outputDirectory, { recursive: true });
  chrome = await launch({ chromeFlags: ['--headless=new'] });

  for (const route of routes) {
    const result = await lighthouse(
      new URL(route, origin).href,
      {
        port: chrome.port,
        logLevel: 'error',
        output: ['json', 'html'],
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
      values.desktop ? desktopConfig : undefined,
    );
    if (!result || result.lhr.runtimeError) {
      throw new Error(
        result?.lhr.runtimeError?.message ??
          `No Lighthouse result for ${route}`,
      );
    }
    const { lhr } = result;
    if (lhr.configSettings.formFactor !== profile) {
      throw new Error(
        `Expected ${profile} settings, received ${lhr.configSettings.formFactor}.`,
      );
    }
    const pathname = new URL(route, origin).pathname;
    const slug =
      encodeURIComponent(
        pathname.replace(/^\/+|\/+$/g, '').replaceAll('/', '-'),
      ) || 'home';
    const name = `${slug}-${profile}`;
    const reports = Array.isArray(result.report)
      ? result.report
      : [result.report];
    await writeFile(
      new URL(`${name}.json`, outputDirectory),
      reports[0] ?? JSON.stringify(lhr),
    );
    if (reports[1])
      await writeFile(new URL(`${name}.html`, outputDirectory), reports[1]);
    const summary = {
      route,
      profile,
      performance: lhr.categories['performance']?.score ?? null,
      accessibility: lhr.categories['accessibility']?.score ?? null,
      bestPractices: lhr.categories['best-practices']?.score ?? null,
      seo: lhr.categories['seo']?.score ?? null,
      lcpMs: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
      tbtMs: lhr.audits['total-blocking-time']?.numericValue ?? null,
    };
    summaries.push(summary);
    console.log(JSON.stringify(summary));
    // Only crawlability is exempt: preview builds intentionally prohibit indexing.
    const seoFailures =
      lhr.categories['seo']?.auditRefs.filter(
        ({ id, weight }) =>
          weight > 0 &&
          id !== 'is-crawlable' &&
          (lhr.audits[id]?.score ?? 1) < 1,
      ) ?? [];
    if (seoFailures.length)
      console.error(
        'SEO audit failures:',
        seoFailures.map(({ id }) => id),
      );
    if (
      seoFailures.length > 0 ||
      (summary.performance ?? 0) < 0.95 ||
      summary.accessibility !== 1 ||
      summary.bestPractices !== 1 ||
      summary.cls === null ||
      summary.cls > 0.01 ||
      summary.lcpMs === null ||
      summary.lcpMs > 2500 ||
      summary.tbtMs === null ||
      summary.tbtMs > 200
    ) {
      process.exitCode = 1;
    }
  }
  await writeFile(
    new URL(`summary-${profile}.json`, outputDirectory),
    `${JSON.stringify(summaries, null, 2)}\n`,
  );
  if (process.exitCode)
    console.error(
      'Performance budget failed; inspect lighthouse-report/*.html.',
    );
} finally {
  chrome?.kill();
  if (
    !previewError &&
    preview.exitCode === null &&
    preview.signalCode === null
  ) {
    const stopped = once(preview, 'exit');
    preview.kill('SIGTERM');
    const forceStop = setTimeout(() => preview.kill('SIGKILL'), 5000);
    forceStop.unref();
    await stopped;
    clearTimeout(forceStop);
  }
}
