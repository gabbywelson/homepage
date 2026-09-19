import {
  auditCategories,
  auditProfiles,
  auditTarget,
  median,
  parseSiteAudit,
} from '../../src/lib/site-audit.ts';

/** @typedef {{ profile: 'desktop' | 'mobile', version: string, scores: import('../../src/lib/site-audit').AuditScores }} AuditRun */

/**
 * @param {AuditRun[]} runs
 * @param {{ commit: string, deploymentId: string, measuredAt: string }} metadata
 */
export function summarizeAudit(runs, metadata) {
  const version = runs[0]?.version;
  if (
    !version ||
    runs.length !== 6 ||
    runs.some((run) => run.version !== version)
  )
    throw new Error(
      'Expected six complete runs using the same Lighthouse version.',
    );
  const scores = Object.fromEntries(
    auditProfiles.map((profile) => {
      const measurements = runs.filter((run) => run.profile === profile);
      return [
        profile,
        Object.fromEntries(
          auditCategories.map(({ key }) => [
            key,
            median(measurements.map((run) => run.scores[key])),
          ]),
        ),
      ];
    }),
  );
  return parseSiteAudit({
    schemaVersion: 1,
    url: auditTarget,
    ...metadata,
    lighthouseVersion: version,
    runs: 3,
    scores,
  });
}

/** @param {string} value */
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** A plain, accessible report index remains usable with JavaScript disabled.
 * @param {import('../../src/lib/site-audit').SiteAudit} summary
 */
export function reportIndex(summary) {
  const rows = auditCategories
    .map(
      ({ key, label }) =>
        `<tr><th scope="row">${label}</th>${auditProfiles.map((profile) => `<td>${summary.scores[profile][key]}</td>`).join('')}</tr>`,
    )
    .join('');
  const reports = auditProfiles
    .map(
      (profile) =>
        `<section id="${profile}"><h2>${profile === 'desktop' ? 'Desktop' : 'Mobile'} reports</h2><ul>${[1, 2, 3].map((n) => `<li><a href="${profile}-${n}.html">Run ${n}</a> · <a href="${profile}-${n}.json">JSON</a></li>`).join('')}</ul></section>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="light dark"><title>Homepage Lighthouse reports · Gabby Welson</title><style>
  body {
    font: 1rem/1.7 system-ui, sans-serif;
    max-width: 42rem;
    margin: auto;
    padding: 2rem 1rem;
    background: #faf8f3;
    color: #383d35;
  }
  h1, h2 {
    font-family: ui-monospace, monospace;
    line-height: 1.35;
  }
  h1 { font-size: 1.6rem; }
  h2 {
    font-size: 1.1rem;
    margin-top: 2rem;
  }
  a { color: #56714e; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 2rem 0;
  }
  th, td {
    padding: .65rem .25rem;
    text-align: right;
    border-bottom: 1px solid #e2e3d8;
  }
  th:first-child { text-align: left; }
  code { overflow-wrap: anywhere; }
  small { color: #686e61; }
  @media (prefers-color-scheme: dark) {
    body {
      background: #202721;
      color: #e5e7d9;
    }
    a { color: #b7ca9e; }
    small { color: #adb5a5; }
    th, td { border-color: #3b453a; }
  }
  </style></head><body><main><a href="https://welson.net/colophon/">← Back to the Colophon</a><h1>Keeping this little corner quick</h1><p>Last completed audit of <a href="${auditTarget}">the homepage</a>, measured <time datetime="${summary.measuredAt}">${escape(new Date(summary.measuredAt).toUTCString())}</time>.</p><p>Source <a href="https://github.com/gabbywelson/homepage/commit/${summary.commit}"><code>${summary.commit.slice(0, 7)}</code></a> · Lighthouse ${escape(summary.lighthouseVersion)}</p><table><caption>Median scores out of 100, from three runs per device</caption><thead><tr><th scope="col">Category</th><th scope="col">Desktop</th><th scope="col">Mobile</th></tr></thead><tbody>${rows}</tbody></table><p>Each category is aggregated separately. The individual reports below include every run, including lower scores. Automated lab checks do not replace manual accessibility testing or measure every visitor’s experience.</p>${reports}<p><small>Reports update after successful production releases. If a new audit cannot finish, this page keeps the previous completed measurement and its original date.</small></p></main></body></html>`;
}
