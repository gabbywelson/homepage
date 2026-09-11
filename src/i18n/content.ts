import { getCollection, type CollectionEntry } from 'astro:content';
import {
  contentIdentity,
  defaultLocale,
  localizedPath,
  locales,
  sourcePath,
  type Locale,
} from './locales';
import { hasMessages } from './messages';
import { localizedShellPaths, resolveLocalizedLink } from './navigation';

export type WritingCollection = 'blog' | 'pages' | 'notes';

export function contentPath(collection: WritingCollection, id: string): string {
  const { locale, slug } = contentIdentity(id);
  const prefix =
    collection === 'pages' ? '' : collection === 'notes' ? 'garden/' : 'blog/';
  return localizedPath(`/${prefix}${slug}/`, locale);
}

/** Publication always follows the original, even if a translation is stale. */
export async function localizedEntries<C extends WritingCollection>(
  collection: C,
  locale: Locale = defaultLocale,
): Promise<CollectionEntry<C>[]> {
  if (!hasMessages(locale)) return [];
  const entries = await getCollection(collection);
  const originals = new Map(
    entries
      .filter((entry) => contentIdentity(entry.id).locale === defaultLocale)
      .map((entry) => [contentIdentity(entry.id).slug, entry]),
  );
  return entries.filter((entry) => {
    const identity = contentIdentity(entry.id);
    if (identity.locale !== locale) return false;
    const original = originals.get(identity.slug);
    if (!original) return false;
    if (
      'pubDate' in original.data &&
      (original.data.draft || original.data.pubDate > new Date())
    )
      return false;
    // Prevent translated metadata from changing chronology, assets, or taxonomy.
    for (const key of [
      'pubDate',
      'updatedDate',
      'draft',
      'priorityImage',
      'tags',
    ] as const) {
      if (
        JSON.stringify(Reflect.get(entry.data, key)) !==
        JSON.stringify(Reflect.get(original.data, key))
      ) {
        throw new Error(
          `${collection}/${entry.id}: ${key} must match the English original`,
        );
      }
    }
    return true;
  });
}

export async function availablePaths(locale: Locale): Promise<Set<string>> {
  if (!hasMessages(locale)) return new Set();
  const collections = ['blog', 'pages', 'notes'] as const;
  const entries = await Promise.all(
    collections.map(async (collection) =>
      (await localizedEntries(collection, locale)).map((entry) =>
        contentPath(collection, entry.id),
      ),
    ),
  );
  const paths = new Set(entries.flat());
  // A locale can browse its translated writing even when only one note is ready.
  if (paths.size) {
    paths.add(localizedPath('/blog/', locale));
    for (const path of localizedShellPaths)
      paths.add(localizedPath(path, locale));
  }
  if (locale === defaultLocale)
    for (const path of ['/', '/resume/', '/blog/', '/404/']) paths.add(path);
  return paths;
}

export async function languageAlternates(
  path: string,
): Promise<{ locale: Locale; href: string }[]> {
  // These routes currently translate the surrounding UI, not their English prose.
  if (localizedShellPaths.some((shell) => shell === sourcePath(path)))
    return [];
  const candidates = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      href: localizedPath(path, locale),
      paths: await availablePaths(locale),
    })),
  );
  return candidates
    .filter(({ href, paths }) => paths.has(href))
    .map(({ locale, href }) => ({ locale, href }));
}

export function availableHref(
  path: string,
  locale: Locale,
  paths: Set<string>,
): string {
  return availableLink(path, locale, paths).href;
}

export function availableLink(
  path: string,
  locale: Locale,
  paths: Set<string>,
) {
  return resolveLocalizedLink(path, locale, (target) => paths.has(target));
}
