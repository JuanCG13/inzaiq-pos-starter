import type { Locale } from '../locales';
import type { Messages } from '../types';

/** One loader per registered locale (the Record type fails to compile if a language is missing). */
export const messageLoaders: Record<Locale, () => Promise<Messages>> = {
  en: async () => (await import('./en')).default,
  es: async () => (await import('./es')).default,
};
