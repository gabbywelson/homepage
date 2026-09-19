import { mkdir, writeFile } from 'node:fs/promises';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import {
  auditCategories,
  auditProfiles,
  auditTarget,
  deployedCommit,
} from '../src/lib/site-audit.ts';
import { summarizeAudit, reportIndex } from './lib/audit-results.mjs';

const commit = process.env['AUDIT_COMMIT'];
const deploymentId = process.env['AUDIT_DEPLOYMENT_ID'];
if (
  !commit ||
  !/^[a-f0-9]{40}$/.test(commit) ||
  !deploymentId ||
  !/^[a-f0-9-]{36}$/.test(deploymentId)
)
  throw new Error('A valid AUDIT_COMMIT and AUDIT_DEPLOYMENT_ID are required.');

async function assertRelease() {
  const response = await fetch(auditTarget, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (
    !response.ok ||
    response.url !== auditTarget ||
    deployedCommit(await response.text()) !== commit
  )
    throw new Error(
      'The live release changed or could not be verified; keeping the previous audit.',
    );
}

await assertRelease();
const output = new URL('../lighthouse-report/published/', import.meta.url);
await mkdir(output, { recursive: true });
/** @type {import('./lib/audit-results.mjs').AuditRun[]} */
const runs = [];
const chromeFlags = ['--headless', '--disable-extensions'];
// GitHub's Ubuntu runners restrict the downloaded Chromium's sandbox startup.
// Limit this exception to the disposable CI runner auditing our public homepage.
if (process.platform === 'linux' && process.env['GITHUB_ACTIONS'] === 'true')
  chromeFlags.push('--no-sandbox');
const chrome = await launch({
  chromeFlags,
  logLevel: 'error',
});
try {
  for (const profile of auditProfiles) {
    for (let n = 1; n <= 3; n++) {
      await assertRelease();
      const result = await lighthouse(
        auditTarget,
        {
          port: chrome.port,
          logLevel: 'error',
          output: ['html', 'json'],
          onlyCategories: auditCategories.map(({ key }) => key),
        },
        profile === 'desktop' ? desktopConfig : undefined,
      );
      if (!result || result.lhr.runtimeError)
        throw new Error(
          result?.lhr.runtimeError?.message ?? 'Lighthouse did not finish.',
        );
      const { lhr } = result;
      if (
        lhr.finalDisplayedUrl !== auditTarget ||
        lhr.configSettings.formFactor !== profile
      )
        throw new Error('Lighthouse measured an unexpected page or device.');
      /** @param {import('../src/lib/site-audit').AuditCategory} category */
      const score = (category) => {
        const value = lhr.categories[category]?.score;
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 1
        )
          throw new Error(`Incomplete ${category} audit.`);
        return Math.round(value * 100);
      };
      const scores = {
        performance: score('performance'),
        accessibility: score('accessibility'),
        'best-practices': score('best-practices'),
        seo: score('seo'),
      };
      runs.push({ profile, version: lhr.lighthouseVersion, scores });
      const reports = result.report;
      if (!Array.isArray(reports) || !reports[0] || !reports[1])
        throw new Error('Missing Lighthouse reports.');
      await writeFile(
        new URL(`${profile}-${n}.html`, output),
        reports[0].replace(
          '<head>',
          '<head>\n<meta name="robots" content="noindex, nofollow">',
        ),
      );
      await writeFile(new URL(`${profile}-${n}.json`, output), reports[1]);
      console.log(JSON.stringify({ profile, run: n, scores }));
    }
  }
} finally {
  chrome.kill();
}
await assertRelease();
const summary = summarizeAudit(runs, {
  commit,
  deploymentId,
  measuredAt: new Date().toISOString(),
});
await writeFile(
  new URL('latest.json', output),
  `${JSON.stringify(summary, null, 2)}\n`,
);
await writeFile(new URL('index.html', output), reportIndex(summary));
console.log(
  'All six measurements completed. Ready to publish:',
  JSON.stringify(summary),
);
