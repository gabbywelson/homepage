import { activityRange, mergeCalendars } from './github-activity';

/** Explicitly labeled synthetic preview data; never allowed in an indexable build. */
export function demoGitHubActivity(now = new Date()) {
  const { from, to } = activityRange(now);
  const personal = [];
  const work = [];
  for (let i = 0; i < 365; i++) {
    const day = new Date(`${from}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    const weekday = day.getUTCDay();
    personal.push({
      date,
      count: i % 5 === 0 || i % 7 === 0 ? ((i * 7) % 17) + 1 : 0,
    });
    work.push({
      date,
      count:
        weekday > 0 && weekday < 6 && i % 11 !== 0 ? ((i * 3) % 23) + 1 : 0,
    });
  }
  return mergeCalendars(personal, work, from, to);
}
