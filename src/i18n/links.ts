import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import redirects from '../data/legacy-redirects.json';
import { isLocale, localizedPath, type Locale } from './locales';

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

/** Only rewrite known published content routes; assets, external URLs and
 * cross-page fragments retain their original destinations. */
export function localizeMarkdownLink(
  href: string,
  fileURL: URL | undefined,
): { href: string; hreflang?: string } {
  if (!fileURL || !href.startsWith('/') || href.startsWith('//'))
    return { href };
  const [, candidate] = relative(contentRoot, fileURLToPath(fileURL)).split(
    '/',
  );
  if (!candidate || !isLocale(candidate) || candidate === 'en') return { href };
  const locale = candidate;
  const url = new URL(href, 'https://welson.net');
  if (url.hash) return { href, hreflang: 'en' };
  const redirectKey = url.pathname.replace(/\/$/, '');
  const redirect: unknown = Reflect.get(redirects, redirectKey);
  if (typeof redirect === 'string') url.pathname = redirect;
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (!existsSync(join(messagesRoot, `${locale}.json`)))
    return { href, hreflang: 'en' };
  if (path === '/blog/' && hasWriting(locale))
    return { href: localizedPath(path, locale) + url.search, hreflang: locale };
  const parts = path.split('/').filter(Boolean);
  const collection =
    parts[0] === 'blog'
      ? 'blog'
      : parts[0] === 'garden' && parts.length > 1
        ? 'notes'
        : 'pages';
  const slug =
    collection === 'pages' ? parts.join('/') : parts.slice(1).join('/');
  if (
    slug &&
    existsSync(join(contentRoot, collection, locale, `${slug}.md`)) &&
    published(join(contentRoot, collection, 'en', `${slug}.md`))
  ) {
    return { href: localizedPath(path, locale) + url.search, hreflang: locale };
  }
  return { href, hreflang: 'en' };
}
