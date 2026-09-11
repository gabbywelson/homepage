import config from '../../gt.config.json' with { type: 'json' };

export const languages = {
  en: { name: 'English', nativeName: 'English', og: 'en_US' },
  es: { name: 'Spanish', nativeName: 'Español', og: 'es_ES' },
  fr: { name: 'French', nativeName: 'Français', og: 'fr_FR' },
  'zh-CN': { name: 'Simplified Chinese', nativeName: '简体中文', og: 'zh_CN' },
} as const;

export type Locale = keyof typeof languages;
export const defaultLocale = 'en';

export function isLocale(value: string): value is Locale {
  return Object.hasOwn(languages, value);
}

export const locales: Locale[] = [
  defaultLocale,
  ...config.locales.map((locale) => {
    if (!isLocale(locale))
      throw new Error(`Missing language details for ${locale}`);
    return locale;
  }),
];

if (config.defaultLocale !== defaultLocale)
  throw new Error('GT and site default locales must agree');

/** URL prefixes are lowercase, while language tags retain their BCP-47 spelling. */
export function localeFromPath(path: string): Locale {
  return (
    locales.find((locale) => locale.toLowerCase() === path.split('/')[1]) ??
    defaultLocale
  );
}

export function sourcePath(path: string): string {
  const locale = localeFromPath(path);
  return locale === defaultLocale ? path : path.slice(locale.length + 1) || '/';
}

export function localizedPath(path: string, locale: Locale): string {
  const source = sourcePath(path);
  return locale === defaultLocale
    ? source
    : `/${locale.toLowerCase()}${source}`;
}

export function contentIdentity(id: string): { locale: Locale; slug: string } {
  const [candidate = '', ...parts] = id.split('/');
  if (!isLocale(candidate) || !parts.length)
    throw new Error(`Invalid localized content ID: ${id}`);
  return { locale: candidate, slug: parts.join('/') };
}
