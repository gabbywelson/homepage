import redirects from '../data/legacy-redirects.json' with { type: 'json' };
import {
  defaultLocale,
  localizedPath,
  sourcePath,
  type Locale,
} from './locales';

const siteOrigin = 'https://welson.net';
export const localizedShellPaths = ['/', '/resume/'] as const;

/** One policy for authored links in Astro views and compiled Markdown.
 * Explicit language-switch and English-original links bypass this helper.
 */
export function resolveLocalizedLink(
  href: string,
  locale: Locale,
  hasPath: (path: string) => boolean,
): { href: string; hreflang?: Locale } {
  // Preserve in-page anchors, relative assets, email links and external URLs.
  if (!href.startsWith('/') && !href.startsWith(`${siteOrigin}/`))
    return { href };
  const url = new URL(href, siteOrigin);
  if (url.origin !== siteOrigin) return { href };
  let path = sourcePath(url.pathname);
  const redirect: unknown = Reflect.get(redirects, path.replace(/\/$/, ''));
  if (typeof redirect === 'string') path = redirect;
  // Only route-shaped URLs get a language prefix; endpoints and assets do not.
  if (/\.[^/]+$/.test(path)) return { href };
  if (!path.endsWith('/')) path += '/';
  const target = localizedPath(path, locale);
  // Translated headings can have different IDs, so cross-page fragments use
  // the English original. In-page fragments were already preserved above.
  const destination = !url.hash && hasPath(target) ? target : path;
  return {
    href: destination + url.search + url.hash,
    hreflang: destination === path ? defaultLocale : locale,
  };
}
