import english from './messages/en.json';
import { defaultLocale, locales, type Locale } from './locales';

export type Messages = typeof english;
export const messageKeys = Object.keys(english) as (keyof Messages)[];

export function validateMessages(value: unknown): Messages {
  if (!value || typeof value !== 'object')
    throw new Error('Expected a translation dictionary');
  for (const key of messageKeys) {
    if (
      !(key in value) ||
      typeof Reflect.get(value, key) !== 'string' ||
      !String(Reflect.get(value, key)).trim()
    ) {
      throw new Error(`Missing translation for ${key}`);
    }
  }
  return value as Messages;
}

// Build-time imports only: no dictionaries or translation service in the browser.
const files = import.meta.glob<unknown>('./messages/*.json', {
  eager: true,
  import: 'default',
});
const dictionaries = new Map<Locale, Messages>([[defaultLocale, english]]);
for (const locale of locales) {
  const file = files[`./messages/${locale}.json`];
  if (file) dictionaries.set(locale, validateMessages(file));
}

export function hasMessages(locale: Locale): boolean {
  return dictionaries.has(locale);
}

export function messages(locale: Locale): Messages {
  const result = dictionaries.get(locale);
  if (!result)
    throw new Error(
      `Generate the ${locale} UI dictionary before publishing this language`,
    );
  return result;
}
