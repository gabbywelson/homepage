export const auditTarget = 'https://welson.net/';
export const auditReports = 'https://gabbywelson.github.io/homepage/';
export const auditRepository = 'gabbywelson/homepage';
export const auditCategories = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'best-practices', label: 'Best practices' },
  { key: 'seo', label: 'SEO' },
] as const;
export const auditProfiles = ['desktop', 'mobile'] as const;
export type AuditCategory = (typeof auditCategories)[number]['key'];
export type AuditScores = Record<AuditCategory, number>;
export interface SiteAudit {
  schemaVersion: 1;
  url: typeof auditTarget;
  commit: string;
  deploymentId: string;
  measuredAt: string;
  lighthouseVersion: string;
  runs: 3;
  scores: Record<(typeof auditProfiles)[number], AuditScores>;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid audit data.');
  return value as Record<string, unknown>;
}

function string(value: unknown, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value))
    throw new Error('Invalid audit metadata.');
  return value;
}

function scores(value: unknown): AuditScores {
  const data = record(value);
  const score = (key: AuditCategory) => {
    const n = data[key];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 100)
      throw new Error('Invalid audit score.');
    return n;
  };
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    'best-practices': score('best-practices'),
    seo: score('seo'),
  };
}

/** Validate the small public file before inserting any of its data into a page. */
export function parseSiteAudit(value: unknown): SiteAudit {
  const data = record(value);
  if (
    data['schemaVersion'] !== 1 ||
    data['url'] !== auditTarget ||
    data['runs'] !== 3
  )
    throw new Error('Unexpected audit format or target.');
  const measuredAt = string(
    data['measuredAt'],
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  if (
    !Number.isFinite(Date.parse(measuredAt)) ||
    new Date(measuredAt).toISOString() !== measuredAt
  )
    throw new Error('Invalid audit date.');
  const profiles = record(data['scores']);
  return {
    schemaVersion: 1,
    url: auditTarget,
    commit: string(data['commit'], /^[a-f0-9]{40}$/),
    deploymentId: string(data['deploymentId'], /^[a-f0-9-]{36}$/),
    measuredAt,
    lighthouseVersion: string(data['lighthouseVersion'], /^\d+\.\d+\.\d+$/),
    runs: 3,
    scores: {
      desktop: scores(profiles['desktop']),
      mobile: scores(profiles['mobile']),
    },
  };
}

export function median(values: readonly number[]): number {
  if (values.length !== 3 || values.some((n) => !Number.isFinite(n)))
    throw new Error('Expected three complete measurements.');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted[1];
  if (middle === undefined) throw new Error('Missing median.');
  return middle;
}

export function deployedCommit(html: string): string | undefined {
  return html.match(
    /href="https:\/\/github\.com\/gabbywelson\/homepage\/commit\/([a-f0-9]{40})"/,
  )?.[1];
}
