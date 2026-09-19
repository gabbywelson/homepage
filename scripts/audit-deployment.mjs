// Wait for Cloudflare's successful production check and the matching live HTML.
import { appendFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import {
  auditReports,
  auditRepository,
  auditTarget,
  deployedCommit,
  parseSiteAudit,
} from '../src/lib/site-audit.ts';

const commit = process.env['AUDIT_COMMIT'];
const token = process.env['GH_TOKEN'];
if (!commit || !/^[a-f0-9]{40}$/.test(commit) || !token)
  throw new Error('AUDIT_COMMIT and GH_TOKEN are required.');

/** @param {string} path */
async function github(path) {
  const response = await fetch(
    `https://api.github.com/repos/${auditRepository}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(`GitHub check lookup failed (${response.status}).`);
  return response.json();
}

/** @param {Record<string, string>} values */
async function output(values) {
  const path = process.env['GITHUB_OUTPUT'];
  if (!path) throw new Error('GITHUB_OUTPUT is required.');
  await appendFile(
    path,
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(''),
  );
}

let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  /** @type {{ check_runs: Array<{ id: number, name: string, app: { id: number }, conclusion: string | null, status: string, details_url: string }> }} */
  const data = await github(`commits/${commit}/check-runs?per_page=100`);
  const check = data.check_runs
    .filter(
      (item) =>
        item.app.id === 85455 && item.name === 'Workers Builds: homepage',
    )
    .sort((a, b) => b.id - a.id)[0];
  if (check?.status === 'completed' && check.conclusion !== 'success')
    throw new Error(
      'The Cloudflare production build did not succeed; keeping the previous audit.',
    );
  if (check?.conclusion === 'success') {
    const deployment = check.details_url.match(
      /\/homepage\/production\/builds\/([a-f0-9-]{36})$/,
    )?.[1];
    if (!deployment)
      throw new Error('Unexpected Cloudflare production build URL.');
    const response = await fetch(auditTarget, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (
      response.ok &&
      response.url === auditTarget &&
      deployedCommit(await response.text()) === commit
    ) {
      let alreadyPublished = false;
      if (process.env['AUDIT_FORCE'] !== 'true') {
        try {
          const previous = await fetch(new URL('latest.json', auditReports), {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
          });
          if (previous.ok) {
            const summary = parseSiteAudit(await previous.json());
            alreadyPublished =
              summary.commit === commit && summary.deploymentId === deployment;
          }
        } catch {
          /* An unavailable previous report must not prevent a fresh measurement. */
        }
      }
      await output({ ready: String(!alreadyPublished), commit, deployment });
      console.log(
        alreadyPublished
          ? 'This deployment already has a published audit.'
          : `Verified production commit ${commit.slice(0, 7)}.`,
      );
      ready = true;
      break;
    }
  }
  // A newer main commit can supersede this job while Cloudflare is deploying it.
  /** @type {{ sha: string }} */
  const main = await github('commits/main');
  if (main.sha !== commit) {
    await output({ ready: 'false' });
    console.log('A newer release superseded this audit.');
    ready = true;
    break;
  }
  console.log('Waiting for Cloudflare and the matching production HTML…');
  await delay(15000);
}
if (!ready)
  throw new Error(
    'Production did not become ready within ten minutes; keeping the previous audit.',
  );
