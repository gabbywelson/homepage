import {
  auditCategories,
  auditProfiles,
  auditReports,
  auditRepository,
  parseSiteAudit,
} from '../lib/site-audit';

async function loadAudit(section: HTMLElement) {
  const status = section.querySelector<HTMLElement>('[data-audit-status]');
  if (!status) return;
  try {
    const response = await fetch(new URL('latest.json', auditReports), {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) {
      status.textContent =
        'The first published audit will appear here after a production release.';
      return;
    }
    if (!response.ok) throw new Error('Audit unavailable.');
    const data: unknown = await response.json();
    const audit = parseSiteAudit(data);
    for (const profile of auditProfiles) {
      for (const { key } of auditCategories) {
        const cell = section.querySelector<HTMLElement>(
          `[data-audit-score="${profile}:${key}"]`,
        );
        if (!cell) continue;
        const score = audit.scores[profile][key];
        cell.textContent = String(score);
        cell.dataset['rating'] =
          score >= 90 ? 'good' : score >= 50 ? 'moderate' : 'poor';
      }
    }
    const time = document.createElement('time');
    time.dateTime = audit.measuredAt;
    time.textContent = new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(audit.measuredAt));
    status.replaceChildren('Last completed homepage audit: ', time, ' UTC.');
    const version = section.querySelector('[data-audit-version]');
    if (version) version.textContent = audit.lighthouseVersion;
    const commit = section.querySelector<HTMLAnchorElement>(
      '[data-audit-commit]',
    );
    if (commit) {
      commit.href = `https://github.com/${auditRepository}/commit/${audit.commit}`;
      commit.textContent = `Source ${audit.commit.slice(0, 7)}`;
    }
    section
      .querySelector<HTMLElement>('[data-audit-source]')
      ?.removeAttribute('hidden');
  } catch {
    status.textContent =
      'Scores couldn’t be loaded just now. You can still browse the dated reports below.';
  }
}

const section = document.querySelector<HTMLElement>('[data-site-audit]');
if (section) void loadAudit(section);
