import type { CollectionEntry } from 'astro:content';
import { localizedEntries } from '../i18n/content';
import { defaultLocale, type Locale } from '../i18n/locales';

export async function getPosts(
  locale: Locale = defaultLocale,
): Promise<CollectionEntry<'blog'>[]> {
  return (await localizedEntries('blog', locale)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function formatDate(date: Date, locale: Locale = defaultLocale): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
