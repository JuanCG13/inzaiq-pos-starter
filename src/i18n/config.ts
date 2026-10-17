import { templateConfig } from '@/template.config';
import { isLocale, localeRegistry, type Locale } from './locales';

export interface I18nSettings { defaultLocale: Locale; locales: Locale[]; formatConfig: { defaultLocale: Locale; locale: string } }

/** Problems with the installation's language/currency configuration; empty when valid. Used by doctor and tests. */
export function validateLocalization(config: { currency: string; currencies: readonly string[]; locale: string; i18n: { defaultLocale: string; locales: readonly string[] } }): string[] {
  const problems: string[] = [];
  const { defaultLocale, locales } = config.i18n;
  if (!locales.length) problems.push('i18n.locales must list at least one language.');
  for (const code of locales) if (!isLocale(code)) problems.push(`i18n.locales contains "${code}" but no dictionary is registered for it (src/i18n/locales.ts).`);
  if (new Set(locales).size !== locales.length) problems.push('i18n.locales contains duplicates.');
  if (!locales.includes(defaultLocale)) problems.push('i18n.defaultLocale must be one of i18n.locales.');
  try { new Intl.NumberFormat(config.locale); } catch { problems.push(`locale "${config.locale}" is not a valid BCP 47 tag.`); }
  if (config.locale.toLowerCase().split('-')[0] !== defaultLocale.toLowerCase().split('-')[0]) problems.push('locale must use the language of i18n.defaultLocale (for example en-US with "en").');
  const supported = typeof Intl.supportedValuesOf === 'function' ? new Set(Intl.supportedValuesOf('currency')) : null;
  for (const code of [config.currency, ...config.currencies]) {
    if (!/^[A-Z]{3}$/.test(code)) problems.push(`Currency "${code}" must be a three-letter uppercase ISO 4217 code.`);
    else if (supported && !supported.has(code)) problems.push(`Currency "${code}" is not supported by this runtime's Intl data.`);
  }
  if (!config.currencies.includes(config.currency)) problems.push('currencies must include the default currency.');
  return problems;
}

/** Runtime view of the configuration. Defensive: a mistyped config degrades to English instead of crashing pages. */
export function i18nSettings(): I18nSettings {
  const locales = templateConfig.i18n.locales.filter(isLocale);
  const defaultLocale = locales.includes(templateConfig.i18n.defaultLocale) ? templateConfig.i18n.defaultLocale : locales[0] ?? 'en';
  return { defaultLocale, locales: locales.length ? locales : [defaultLocale], formatConfig: { defaultLocale, locale: templateConfig.locale } };
}
export const localeLabel = (locale: Locale) => localeRegistry[locale].label;
