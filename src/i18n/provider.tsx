'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { templateConfig } from '@/template.config';
import { createTranslator } from './core';
import { formatDate, formatMoney } from './format';
import type { Locale } from './locales';
import type { Messages, Translator } from './types';

export interface I18nValue {
  locale: Locale;
  /** BCP 47 tag used for numbers and dates. */
  intlLocale: string;
  t: Translator;
  /** Formats integer minor units. Defaults to the installation currency. */
  money: (valueMinor: number, currency?: string) => string;
  date: (isoDate: string) => string;
}
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, intlLocale, messages, children }: { locale: Locale; intlLocale: string; messages: Messages; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    locale, intlLocale, t: createTranslator(locale, intlLocale, messages),
    money: (valueMinor, currency = templateConfig.currency) => formatMoney(intlLocale, valueMinor, currency),
    date: isoDate => formatDate(intlLocale, isoDate),
  }), [locale, intlLocale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n requires I18nProvider');
  return context;
}
