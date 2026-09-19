import { readFile } from 'node:fs/promises';
import {
  auditTarget,
  deployedCommit,
  parseSiteAudit,
} from '../src/lib/site-audit.ts';

// Run immediately before publication as well as during collection. A newer
// release must never receive the previous commit's measurements.
const summary = parseSiteAudit(
  JSON.parse(
    await readFile(
      new URL('../lighthouse-report/published/latest.json', import.meta.url),
      'utf8',
    ),
  ),
);
const response = await fetch(auditTarget, {
  cache: 'no-store',
  signal: AbortSignal.timeout(15000),
});
if (
  !response.ok ||
  response.url !== auditTarget ||
  deployedCommit(await response.text()) !== summary.commit
)
  throw new Error(
    'The audited release is no longer live; keeping the previous report.',
  );
console.log(`Verified ${summary.commit.slice(0, 7)} is still live.`);
