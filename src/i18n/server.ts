import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { createTranslator, formatLocaleFor, mergeMessages, negotiateLocale } from './core';
import { i18nSettings } from './config';
import { LOCALE_COOKIE, localeRegistry, type Locale } from './locales';
import { messageLoaders } from './messages';
import type { Messages, Translator } from './types';

export interface ServerI18n { locale: Locale; intlLocale: string; messages: Messages; t: Translator }

/**
 * Resolves the request's language: NEXT_LOCALE cookie, then Accept-Language, then the installation default.
 * Cached per request. Reading request data makes the routes that call it dynamic, which is intended for this
 * authenticated application. Public API routes and MCP never call it and always answer in English.
 */
export const getI18n = cache(async (): Promise<ServerI18n> => {
  const settings = i18nSettings();
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = negotiateLocale({ cookie: cookieStore.get(LOCALE_COOKIE)?.value, acceptLanguage: headerStore.get('accept-language'), supported: settings.locales, fallback: settings.defaultLocale });
  const intlLocale = formatLocaleFor(locale, localeRegistry[locale].intl, settings.formatConfig);
  const [active, base] = await Promise.all([messageLoaders[locale](), locale === settings.defaultLocale ? undefined : messageLoaders[settings.defaultLocale]()]);
  const messages = base ? mergeMessages(base, active) : active;
  return { locale, intlLocale, messages, t: createTranslator(locale, intlLocale, messages) };
});
