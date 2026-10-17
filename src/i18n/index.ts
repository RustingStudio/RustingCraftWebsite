import en from './en.json';
import de from './de.json';
import ru from './ru.json';

export const LOCALES = ['en', 'de', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export type Dict = typeof en;
const DICTS: Record<Locale, Dict> = { en, de: de as Dict, ru: ru as Dict };

// English lives at the root, the others under /de/ and /ru/: the `[...locale]` param is undefined for English.
export const localePaths = () => LOCALES.map((l) => ({ params: { locale: l === 'en' ? undefined : l } }));
export const localeOf = (param?: string): Locale => (LOCALES.includes(param as Locale) ? (param as Locale) : 'en');
export const t = (locale: Locale) => DICTS[locale];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
// A site path ('/wiki/') in a locale, with the deploy base.
export const href = (locale: Locale, path = '/') => `${BASE}${locale === 'en' ? '' : `/${locale}`}${path}`;
// A static file under public/, with the deploy base.
export const asset = (path: string) => `${BASE}${path}`;
// The same page in another locale: strip the base and the current locale prefix.
export const switchTo = (pathname: string, locale: Locale) => {
  const rest = pathname.slice(BASE.length).replace(/^\/(de|ru)(?=\/)/, '');
  return href(locale, rest || '/');
};
