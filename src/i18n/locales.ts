/**
 * Registry of the languages this codebase ships a dictionary for.
 * To add one: create `messages/<code>.ts`, register it here and in `messages/index.ts`,
 * then enable it in `template.config.ts` (`i18n.locales`). See docs/i18n.md.
 */
export const localeRegistry = {
  en: { label: 'English', intl: 'en-US' },
  es: { label: 'Español', intl: 'es-419' },
} as const;

export type Locale = keyof typeof localeRegistry;
export const availableLocales = Object.keys(localeRegistry) as Locale[];
export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && Object.hasOwn(localeRegistry, value);

/** Cookie that remembers the visitor's explicit choice. It holds only a language code. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
