import { test, expect } from '@playwright/test';
import {
  activityRange,
  calendarWeeks,
  loadGitHubActivity,
  mergeCalendars,
  parseCalendar,
} from '../src/lib/github-activity';
import { demoGitHubActivity } from '../src/lib/github-activity-demo';

const now = new Date('2026-09-17T08:30:00Z');
const demo = demoGitHubActivity(now);
const payload = (login: string) => ({
  data: {
    viewer: {
      login,
      contributionsCollection: {
        contributionCalendar: {
          weeks: [
            {
              contributionDays: demo.days.map((day) => ({
                date: day.date,
                contributionCount:
                  login === 'gabbywelson' ? day.personal : day.work,
              })),
            },
          ],
        },
      },
    },
  },
});

test('merges by date across a leap day, preserving account totals and empty days', () => {
  const activity = mergeCalendars(
    [
      { date: '2024-03-01', count: 0 },
      { date: '2024-02-28', count: 3 },
      { date: '2024-02-29', count: 1 },
    ],
    [
      { date: '2024-02-29', count: 7 },
      { date: '2024-03-01', count: 0 },
      { date: '2024-02-28', count: 0 },
    ],
    '2024-02-28',
    '2024-03-01',
  );
  expect(activity.days.map(({ date, total }) => ({ date, total }))).toEqual([
    { date: '2024-02-28', total: 3 },
    { date: '2024-02-29', total: 8 },
    { date: '2024-03-01', total: 0 },
  ]);
  expect([activity.personal, activity.work, activity.total]).toEqual([
    4, 7, 11,
  ]);
  expect(activity.days[2]?.level).toBe(0);
  expect(activity.days[1]?.level).toBeGreaterThan(activity.days[0]?.level ?? 0);
  const weeks = calendarWeeks(activity.days);
  expect(weeks[0]?.slice(0, 3)).toEqual([null, null, null]);
  expect(weeks[0]?.[3]?.date).toBe('2024-02-28');
  expect(weeks[0]?.[6]).toBeNull();
  expect(() => mergeCalendars([], [], '2024-02-29', '2024-02-29')).toThrow(
    'same date range',
  );
});

test('uses exactly 365 dates, aligned in UTC, including leap years', () => {
  expect(activityRange(new Date('2024-03-01T00:30:00+02:00'))).toEqual({
    from: '2023-03-02',
    to: '2024-02-29',
  });
  expect(demo.days).toHaveLength(365);
  expect(calendarWeeks(demo.days)).toHaveLength(53);
});

test('rejects account mixups, GraphQL errors, gaps, duplicates, and invalid counts', () => {
  const parse = (value: unknown) =>
    parseCalendar(value, 'gabbywelson', demo.from, demo.to);
  expect(parse(payload('gabbywelson'))).toHaveLength(365);
  expect(() => parse(payload('ggwelson'))).toThrow('different account');
  expect(() =>
    parse({
      ...payload('gabbywelson'),
      errors: [{ message: 'upstream detail' }],
    }),
  ).toThrow('Check token permissions');
  const invalid = payload('gabbywelson');
  const days =
    invalid.data.viewer.contributionsCollection.contributionCalendar.weeks[0]
      ?.contributionDays;
  if (!days?.[0]) throw new Error('Missing fixture');
  days[0].contributionCount = -1;
  expect(() => parse(invalid)).toThrow('invalid contribution day');
  days[0].contributionCount = 1;
  days.push(days[0]);
  expect(() => parse(invalid)).toThrow('invalid contribution day');
  days.pop();
  days.pop();
  expect(() => parse(invalid)).toThrow('incomplete calendar');
  expect(() => parse({ data: { viewer: null } })).toThrow(
    'invalid contribution calendar',
  );
});

test('keeps credentials account-specific and requests identical date ranges', async () => {
  const calls: { token: string | null; body: string }[] = [];
  const fetcher: typeof fetch = (url, init) => {
    expect(url).toBe('https://api.github.com/graphql');
    const token = new Headers(init?.headers).get('Authorization');
    if (typeof init?.body !== 'string') throw new Error('Missing query');
    calls.push({ token, body: init.body });
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    return Promise.resolve(
      Response.json(
        payload(
          token === 'Bearer personal-secret' ? 'gabbywelson' : 'ggwelson',
        ),
      ),
    );
  };
  const actual = await loadGitHubActivity({
    personalToken: 'personal-secret',
    workToken: 'work-secret',
    now,
    fetcher,
  });
  expect(actual).toEqual(demo);
  expect(calls.map((call) => call.token)).toEqual([
    'Bearer personal-secret',
    'Bearer work-secret',
  ]);
  expect(calls[0]?.body).toBe(calls[1]?.body);
  expect(calls[0]?.body).toContain('2025-09-18T00:00:00Z');
  expect(JSON.stringify(actual)).not.toContain('secret');
});

test('missing tokens need no network; a partial setup or failed account cannot publish partial data', async () => {
  const unexpectedFetch: typeof fetch = () => {
    throw new Error('Unexpected network call');
  };
  expect(await loadGitHubActivity({ fetcher: unexpectedFetch })).toBeNull();
  await expect(
    loadGitHubActivity({ personalToken: 'secret', fetcher: unexpectedFetch }),
  ).rejects.toThrow('Set both');
  const options = { personalToken: 'secret', workToken: 'secret', now };
  await expect(
    loadGitHubActivity({
      ...options,
      fetcher: () => Promise.resolve(new Response('', { status: 401 })),
    }),
  ).rejects.toThrow('HTTP 401');
  await expect(
    loadGitHubActivity({ ...options, fetcher: unexpectedFetch }),
  ).rejects.toThrow('Retry the build');
  await expect(
    loadGitHubActivity({
      ...options,
      fetcher: () => Promise.resolve(new Response('not JSON')),
    }),
  ).rejects.toThrow('invalid JSON');
});

test('contribution chart supports keyboard navigation and mobile taps', async ({
  page,
}) => {
  await page.goto('/');
  const chart = page.locator('[data-github-activity]');
  test.skip(
    (await chart.count()) === 0,
    'Build with GITHUB_ACTIVITY_DEMO=true or both tokens to exercise the chart.',
  );
  const days = chart.locator('[data-date]');
  await expect(days).toHaveCount(365);
  const active = chart.locator('[data-date][tabindex="0"]');
  await active.focus();
  const last = await active.getAttribute('data-date');
  await page.keyboard.press('ArrowLeft');
  const previous = await active.getAttribute('data-date');
  expect(
    new Date(last ?? '').getTime() - new Date(previous ?? '').getTime(),
  ).toBe(7 * 86_400_000);
  await expect(chart.locator('[data-calendar-detail]')).toHaveText(
    (await active.getAttribute('aria-label')) ?? '',
  );
  await page.keyboard.press('Control+Home');
  const first = await active.getAttribute('data-date');
  expect(new Date(last ?? '').getTime() - new Date(first ?? '').getTime()).toBe(
    364 * 86_400_000,
  );
  await page.keyboard.press('ArrowUp');
  await expect(active).toHaveAttribute('data-date', first ?? '');
  await page.keyboard.press('Control+End');
  await expect(active).toHaveAttribute('data-date', last ?? '');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await chart
      .locator('[data-calendar-scroll]')
      .evaluate((element) => element.scrollLeft),
  ).toBeGreaterThan(0);
  await active.click();
  await expect(chart.locator('[data-calendar-detail]')).toHaveText(
    (await active.getAttribute('aria-label')) ?? '',
  );
});
