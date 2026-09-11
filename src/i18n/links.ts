import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { isLocale, localeFromPath, sourcePath, type Locale } from './locales';
import { localizedShellPaths, resolveLocalizedLink } from './navigation';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const messagesRoot = fileURLToPath(new URL('./messages/', import.meta.url));

/** Read source publication metadata without depending on Astro's content store
 * while that store is still being populated by the Markdown compiler. */
function published(file: string): boolean {
  if (!existsSync(file)) return false;
  const frontmatter = readFileSync(file, 'utf8').match(
    /^---\r?\n([\s\S]*?)\r?\n---/,
  );
  if (!frontmatter?.[1]) return false;
  const data: unknown = parse(frontmatter[1]);
  if (!data || typeof data !== 'object') return false;
  if ('draft' in data && data.draft === true) return false;
  if ('pubDate' in data) {
    const date = new Date(String(data.pubDate));
    return Number.isFinite(date.valueOf()) && date <= new Date();
  }
  return true;
}

function hasWriting(locale: Locale): boolean {
  return ['blog', 'pages', 'notes'].some((collection) => {
    const directory = join(contentRoot, collection, locale);
    return (
      existsSync(directory) &&
      readdirSync(directory, { recursive: true }).some(
        (file) =>
          typeof file === 'string' &&
          file.endsWith('.md') &&
          published(join(contentRoot, collection, 'en', file)),
      )
    );
  });
}

/** A filesystem route check for the content compilation phase. */
function hasContentPath(path: string): boolean {
  const locale = localeFromPath(path);
  if (!existsSync(join(messagesRoot, `${locale}.json`))) return false;
  const source = sourcePath(path);
  if (
    localizedShellPaths.some((shell) => shell === source) ||
    source === '/blog/'
  )
    return locale === 'en' || hasWriting(locale);
  const parts = source.split('/').filter(Boolean);
  const collection =
    parts[0] === 'blog'
      ? 'blog'
      : parts[0] === 'garden' && parts.length > 1
        ? 'notes'
        : 'pages';
  const slug =
    collection === 'pages' ? parts.join('/') : parts.slice(1).join('/');
  return Boolean(
    slug &&
    existsSync(join(contentRoot, collection, locale, `${slug}.md`)) &&
    published(join(contentRoot, collection, 'en', `${slug}.md`)),
  );
}

/** Use the same link policy as Astro navigation, without importing the content
 * store while the Markdown compiler is still populating that store. */
export function localizeMarkdownLink(
  href: string,
  fileURL: URL | undefined,
): { href: string; hreflang?: string } {
  if (!fileURL) return { href };
  const [, candidate] = relative(contentRoot, fileURLToPath(fileURL)).split(
    '/',
  );
  if (!candidate || !isLocale(candidate)) return { href };
  return resolveLocalizedLink(href, candidate, hasContentPath);
}
