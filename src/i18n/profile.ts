import { getCollection, type CollectionEntry } from 'astro:content';
import { contentIdentity, type Locale } from './locales';
import { translatedFields } from './content-fields.mjs';

/** Select by stable English IDs; orphan translations never become content. */
async function entries<C extends 'home' | 'resume'>(
  collection: C,
  locale: Locale,
) {
  const all = await getCollection(collection);
  const originals = all.filter(
    (entry) => contentIdentity(entry.id).locale === 'en',
  );
  const translated = new Map(all.map((entry) => [entry.id, entry]));
  const fields = translatedFields(collection);
  return originals.map((original) => {
    const entry = translated.get(
      `${locale}/${contentIdentity(original.id).slug}`,
    );
    // Metadata-only employer and education entries deliberately have no body.
    const needsBody =
      collection === 'home' ||
      ('kind' in original.data &&
        ['intro', 'section', 'role', 'skill'].includes(original.data.kind));
    for (const candidate of [original, entry]) {
      if (candidate && needsBody && !candidate.body?.trim())
        throw new Error(
          `${collection}/${candidate.id}: expected Markdown body content`,
        );
    }
    if (entry) {
      for (const key of new Set([
        ...Object.keys(original.data),
        ...Object.keys(entry.data),
      ])) {
        if (
          !fields.includes(key) &&
          JSON.stringify(Reflect.get(original.data, key)) !==
            JSON.stringify(Reflect.get(entry.data, key))
        ) {
          throw new Error(
            `${collection}/${entry.id}: ${key} must match the English original`,
          );
        }
      }
    }
    return { original, entry };
  });
}

/** A page is translated only when all content it renders is available.
 * This keeps incomplete downloads in a coherent, explicitly English fallback. */
export async function profileReady(
  path: string,
  locale: Locale,
): Promise<boolean> {
  const resume = await entries('resume', locale);
  if (path === '/') {
    const home = await entries('home', locale);
    return (
      home.some(({ original, entry }) => original.id === 'en/index' && entry) &&
      resume
        .filter(({ original }) => original.data.kind === 'company')
        .every(({ entry }) => entry)
    );
  }
  return resume.length > 0 && resume.every(({ entry }) => entry);
}

export async function profileContent(path: '/' | '/resume/', locale: Locale) {
  const contentLocale = (await profileReady(path, locale)) ? locale : 'en';
  const resume = (await entries('resume', contentLocale)).map(
    ({ original, entry }) => entry ?? original,
  );
  const home = (await entries('home', contentLocale)).find(
    ({ original }) => original.id === 'en/index',
  );
  if (!home) throw new Error('Missing homepage content: home/en/index.mdx');
  return { locale: contentLocale, home: home.entry ?? home.original, resume };
}

type ResumeData = CollectionEntry<'resume'>['data'];
export function resumeEntries<K extends ResumeData['kind']>(
  entries: CollectionEntry<'resume'>[],
  kind: K,
) {
  return entries
    .filter(
      (
        entry,
      ): entry is CollectionEntry<'resume'> & {
        data: Extract<ResumeData, { kind: K }>;
      } => entry.data.kind === kind,
    )
    .sort(
      (a, b) =>
        ('order' in a.data ? a.data.order : 0) -
        ('order' in b.data ? b.data.order : 0),
    );
}

export function resumeEntry<K extends ResumeData['kind']>(
  entries: CollectionEntry<'resume'>[],
  kind: K,
  slug: string,
) {
  const entry = resumeEntries(entries, kind).find(
    (entry) => contentIdentity(entry.id).slug === slug,
  );
  if (!entry) throw new Error(`Missing résumé ${kind}: ${slug}`);
  return entry;
}

export function formatPeriod(
  start: string | undefined,
  end: string | null | undefined,
  locale: Locale,
  currentLabel: string,
  compact = false,
): string | undefined {
  if (!start) return undefined;
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    ...(compact ? {} : { month: 'long' as const }),
    timeZone: 'UTC',
  });
  const date = (value: string) =>
    formatter.format(new Date(`${value}-01T00:00:00Z`));
  return `${date(start)} — ${end ? date(end) : currentLabel}`;
}
