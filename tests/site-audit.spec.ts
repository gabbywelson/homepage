import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  auditReports,
  deployedCommit,
  median,
  parseSiteAudit,
  type SiteAudit,
} from '../src/lib/site-audit';
import { reportIndex, summarizeAudit } from '../scripts/lib/audit-results.mjs';

const audit: SiteAudit = {
  schemaVersion: 1,
  url: 'https://welson.net/',
  commit: '722553539bff28f270514734f0b77fa967798d8f',
  deploymentId: '7a03002c-e785-4a74-87bd-172a4fa7fa48',
  measuredAt: '2026-09-19T21:37:00.000Z',
  lighthouseVersion: '13.4.1',
  runs: 3,
  scores: {
    desktop: {
      performance: 100,
      accessibility: 100,
      'best-practices': 100,
      seo: 100,
    },
    mobile: {
      performance: 97,
      accessibility: 100,
      'best-practices': 96,
      seo: 66,
    },
  },
};

test('aggregates all runs without cherry-picking perfect scores', () => {
  const runs = (['desktop', 'mobile'] as const).flatMap((profile) =>
    [80, 99, 100].map((performance) => ({
      profile,
      version: '13.4.1',
      scores: { ...audit.scores[profile], performance },
    })),
  );
  const result = summarizeAudit(runs, audit);
  expect(result.scores.mobile).toEqual({
    performance: 99,
    accessibility: 100,
    'best-practices': 96,
    seo: 66,
  });
  expect(() => summarizeAudit(runs.slice(1), audit)).toThrow(
    'six complete runs',
  );
  expect(() =>
    summarizeAudit(
      runs.map((run, i) => (i === 0 ? { ...run, version: '14.0.0' } : run)),
      audit,
    ),
  ).toThrow('same Lighthouse version');
  expect(() => median([100, Number.NaN, 100])).toThrow();
  const index = reportIndex(result);
  expect(index).toContain('mobile-3.html');
  expect(index).toContain('2026-09-19T21:37:00.000Z');
  expect(index).toContain('<td>66</td>');
});

test('rejects incomplete, forged, and out-of-range report data', () => {
  expect(parseSiteAudit(audit)).toEqual(audit);
  for (const patch of [
    { commit: '<script>alert(1)</script>' },
    { url: 'https://elsewhere.example/' },
    { measuredAt: 'yesterday' },
    { scores: { desktop: audit.scores.desktop } },
    {
      scores: {
        ...audit.scores,
        mobile: { ...audit.scores.mobile, seo: null },
      },
    },
    {
      scores: { ...audit.scores, mobile: { ...audit.scores.mobile, seo: 101 } },
    },
  ])
    expect(() => parseSiteAudit({ ...audit, ...patch })).toThrow();
  expect(
    deployedCommit(
      `<a href="https://github.com/gabbywelson/homepage/commit/${audit.commit}">Source</a>`,
    ),
  ).toBe(audit.commit);
  expect(
    deployedCommit('<a href="https://other.example/commit/123">Source</a>'),
  ).toBeUndefined();
});

test('the standalone report index is accessible and retains every run', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.setContent(reportIndex(audit));
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('row', { name: 'SEO 100 66' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Run [123]$/ })).toHaveCount(6);
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`dated results are accessible and fit desktop and mobile in ${theme}`, async ({
    page,
  }) => {
    await page.route(`${auditReports}latest.json`, (route) =>
      route.fulfill({ json: audit }),
    );
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/colophon/');
    const section = page.getByRole('region', {
      name: 'Keeping this little corner quick',
    });
    await expect(
      section.getByRole('row', { name: 'Performance 100 97' }),
    ).toBeVisible();
    await expect(
      section.getByRole('row', { name: 'SEO 100 66' }),
    ).toBeVisible();
    await expect(section.getByRole('status')).toContainText('Sep 19, 2026');
    await expect(section.locator('time')).toHaveAttribute(
      'datetime',
      audit.measuredAt,
    );
    await expect(
      section.getByRole('link', { name: 'Source 7225535' }),
    ).toHaveAttribute(
      'href',
      `https://github.com/gabbywelson/homepage/commit/${audit.commit}`,
    );
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .include('[data-site-audit]')
        .analyze();
      expect(result.violations).toEqual([]);
      await section.screenshot({
        path: `test-results/site-audit-${theme}-${width}.png`,
      });
    }
  });
}

test('unavailable and invalid results never become misleading scores', async ({
  page,
}) => {
  for (const response of ['network', 'invalid', 'missing']) {
    await page.route(`${auditReports}latest.json`, (route) => {
      if (response === 'network') return route.abort();
      if (response === 'missing')
        return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ json: { ...audit, scores: {} } });
    });
    await page.goto('/colophon/');
    const section = page.locator('[data-site-audit]');
    await expect(section.getByRole('status')).toContainText(
      response === 'missing' ? 'first published audit' : 'couldn’t be loaded',
    );
    await expect(section.locator('[data-audit-score]').first()).toHaveText('—');
    await expect(
      section.getByRole('link', { name: 'Browse the full reports ↗' }),
    ).toHaveAttribute('href', auditReports);
    await page.unroute(`${auditReports}latest.json`);
  }
});

test('reports remain reachable without JavaScript; other pages do not fetch scores', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto('/colophon/');
  await expect(
    plain.getByRole('link', { name: 'Browse the full reports ↗' }),
  ).toBeVisible();
  await expect(plain.getByRole('status')).toContainText('dated results');
  await context.close();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(auditReports)) requests.push(request.url());
  });
  await page.goto('/');
  await page.goto('/uses/');
  expect(requests).toEqual([]);
});
