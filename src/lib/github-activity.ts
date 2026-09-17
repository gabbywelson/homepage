/** Build-time GitHub access. Never import this module into a browser script. */
export interface ContributionDay {
  readonly date: string;
  readonly count: number;
}

export interface ActivityDay {
  readonly date: string;
  readonly personal: number;
  readonly work: number;
  readonly total: number;
  readonly level: number;
}

export interface GitHubActivity {
  readonly days: readonly ActivityDay[];
  readonly personal: number;
  readonly work: number;
  readonly total: number;
  readonly from: string;
  readonly to: string;
}

interface ActivityOptions {
  readonly personalToken?: string | undefined;
  readonly workToken?: string | undefined;
  readonly now?: Date;
  readonly fetcher?: typeof fetch;
}

const DAY = 86_400_000;
const query = `query ContributionCalendar($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function activityRange(now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  return {
    from: isoDate(new Date(end.getTime() - 364 * DAY)),
    to: isoDate(end),
  };
}

function dateKeys(from: string, to: string) {
  const dates: string[] = [];
  for (
    let time = new Date(`${from}T00:00:00Z`).getTime();
    time <= new Date(`${to}T00:00:00Z`).getTime();
    time += DAY
  ) {
    dates.push(isoDate(new Date(time)));
  }
  return dates;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('GitHub returned an invalid contribution calendar.');
  }
  return value as Record<string, unknown>;
}

/** Reject partial/error responses rather than publishing missing days as zero. */
export function parseCalendar(
  payload: unknown,
  login: string,
  from: string,
  to: string,
): ContributionDay[] {
  const root = record(payload);
  if (root['errors']) {
    throw new Error(
      `GitHub rejected the calendar query for ${login}. Check token permissions and SSO.`,
    );
  }
  const viewer = record(record(root['data'])['viewer']);
  if (
    typeof viewer['login'] !== 'string' ||
    viewer['login'].toLowerCase() !== login.toLowerCase()
  ) {
    throw new Error(
      `The GitHub token for ${login} belongs to a different account.`,
    );
  }
  const calendar = record(
    record(viewer['contributionsCollection'])['contributionCalendar'],
  );
  const weeks = calendar['weeks'];
  if (!Array.isArray(weeks))
    throw new Error('GitHub returned an invalid calendar.');
  const days = new Map<string, number>();
  for (const week of weeks) {
    const entries = record(week)['contributionDays'];
    if (!Array.isArray(entries))
      throw new Error('GitHub returned an invalid week.');
    for (const entry of entries) {
      const day = record(entry);
      const date = day['date'];
      const count = day['contributionCount'];
      if (
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof count !== 'number' ||
        !Number.isSafeInteger(count) ||
        count < 0 ||
        days.has(date)
      )
        throw new Error('GitHub returned an invalid contribution day.');
      days.set(date, count);
    }
  }
  return dateKeys(from, to).map((date) => {
    const count = days.get(date);
    if (count === undefined)
      throw new Error(`GitHub returned an incomplete calendar for ${login}.`);
    return { date, count };
  });
}

/** Merge by date, not array position; use one intensity scale for both accounts. */
export function mergeCalendars(
  personal: readonly ContributionDay[],
  work: readonly ContributionDay[],
  from: string,
  to: string,
): GitHubActivity {
  const personalByDate = new Map(personal.map((day) => [day.date, day.count]));
  const workByDate = new Map(work.map((day) => [day.date, day.count]));
  const days = dateKeys(from, to).map((date) => {
    const personalCount = personalByDate.get(date);
    const workCount = workByDate.get(date);
    if (personalCount === undefined || workCount === undefined) {
      throw new Error('Both GitHub calendars must cover the same date range.');
    }
    return {
      date,
      personal: personalCount,
      work: workCount,
      total: personalCount + workCount,
    };
  });
  const nonzero = days
    .map((day) => day.total)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);
  // GitHub supplies account-specific levels. Recompute quartiles after merging.
  const thresholds = [0.25, 0.5, 0.75].map(
    (fraction) => nonzero[Math.ceil(nonzero.length * fraction) - 1] ?? 0,
  );
  const personalTotal = days.reduce((sum, day) => sum + day.personal, 0);
  const workTotal = days.reduce((sum, day) => sum + day.work, 0);
  return {
    days: days.map((day) => ({
      ...day,
      level:
        day.total === 0
          ? 0
          : 1 + thresholds.filter((threshold) => day.total > threshold).length,
    })),
    personal: personalTotal,
    work: workTotal,
    total: personalTotal + workTotal,
    from,
    to,
  };
}

export async function loadGitHubActivity({
  personalToken,
  workToken,
  now = new Date(),
  fetcher = fetch,
}: ActivityOptions): Promise<GitHubActivity | null> {
  const personal = personalToken?.trim();
  const work = workToken?.trim();
  if (!personal && !work) return null;
  if (!personal || !work) {
    throw new Error(
      'Set both GITHUB_PERSONAL_TOKEN and GITHUB_WORK_TOKEN to show combined activity.',
    );
  }
  const { from, to } = activityRange(now);
  const fetchCalendar = async (login: string, token: string) => {
    let response: Response;
    try {
      response = await fetcher('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'welson.net-contribution-calendar',
        },
        body: JSON.stringify({
          query,
          variables: { from: `${from}T00:00:00Z`, to: now.toISOString() },
        }),
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      });
    } catch {
      // Never include request headers or raw upstream errors in build logs.
      throw new Error(
        `Could not fetch ${login}'s GitHub calendar within 15 seconds. Retry the build.`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `GitHub calendar for ${login} returned HTTP ${response.status}. Check the token, SSO, and rate limit.`,
      );
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`GitHub returned invalid JSON for ${login}.`);
    }
    return parseCalendar(payload, login, from, to);
  };
  const [personalDays, workDays] = await Promise.all([
    fetchCalendar('gabbywelson', personal),
    fetchCalendar('ggwelson', work),
  ]);
  return mergeCalendars(personalDays, workDays, from, to);
}

export function calendarWeeks(days: readonly ActivityDay[]) {
  const first = days[0];
  if (!first) return [];
  const padding = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  const padded: (ActivityDay | null)[] = [
    ...Array<null>(padding).fill(null),
    ...days,
  ];
  while (padded.length % 7) padded.push(null);
  return Array.from({ length: padded.length / 7 }, (_, i) =>
    padded.slice(i * 7, i * 7 + 7),
  );
}
