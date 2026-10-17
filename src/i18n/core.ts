import type { Locale } from './locales';
import type { Messages, MessageKey, MessageParams, PluralForms, Translator } from './types';

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
export function isPluralForms(value: unknown): value is PluralForms {
  if (!value || typeof value !== 'object') return false;
  const keys = Object.keys(value);
  return typeof (value as PluralForms).other === 'string' && keys.every(key => PLURAL_CATEGORIES.has(key));
}

/** Merges `override` over `base`; plural tables are replaced whole, never mixed. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const merge = (left: Record<string, unknown>, right: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...left };
    for (const [key, value] of Object.entries(right)) {
      const current = left[key];
      result[key] = value && typeof value === 'object' && !isPluralForms(value) && current && typeof current === 'object' && !isPluralForms(current)
        ? merge(current as Record<string, unknown>, value as Record<string, unknown>) : value;
    }
    return result;
  };
  return merge(base as unknown as Record<string, unknown>, override as unknown as Record<string, unknown>) as unknown as Messages;
}

/** Flattens a dictionary to `dot.path -> value`. Used by tests and tooling to compare languages. */
export function flattenMessages(messages: unknown, prefix = ''): Map<string, string | PluralForms> {
  const out = new Map<string, string | PluralForms>();
  for (const [key, value] of Object.entries(messages as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' || isPluralForms(value)) out.set(path, value);
    else if (value && typeof value === 'object') for (const [nested, leaf] of flattenMessages(value, path)) out.set(nested, leaf);
  }
  return out;
}

const formatters = new Map<string, Intl.NumberFormat>();
function numberFormat(intlLocale: string) {
  let formatter = formatters.get(intlLocale);
  if (!formatter) { formatter = new Intl.NumberFormat(intlLocale); formatters.set(intlLocale, formatter); }
  return formatter;
}
const pluralRules = new Map<string, Intl.PluralRules>();
function pluralFor(locale: string, count: number) {
  let rules = pluralRules.get(locale);
  if (!rules) { rules = new Intl.PluralRules(locale); pluralRules.set(locale, rules); }
  return rules.select(count);
}

function lookup(messages: Messages, key: string): string | PluralForms | undefined {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !Object.hasOwn(node, part)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' || isPluralForms(node) ? node : undefined;
}

/**
 * Builds a translator. Messages are plain text with `{name}` placeholders; React escapes the result.
 * A message that is a plural table is selected with `params.count` and the language's CLDR rules.
 * Unknown keys fall back to `fallback` and finally to the key itself, so a gap never crashes the UI.
 */
export function createTranslator(locale: string, intlLocale: string, messages: Messages, fallback?: Messages): Translator {
  return (key: MessageKey, params?: MessageParams) => {
    const entry = lookup(messages, key) ?? (fallback ? lookup(fallback, key) : undefined);
    if (entry === undefined) return key;
    let template: string;
    if (typeof entry === 'string') template = entry;
    else {
      const count = Number(params?.count);
      template = (Number.isFinite(count) ? entry[pluralFor(locale, count)] : undefined) ?? entry.other;
    }
    return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
      const value = params?.[name];
      if (value === undefined) return placeholder;
      return typeof value === 'number' ? numberFormat(intlLocale).format(value) : value;
    });
  };
}

export function placeholdersOf(value: string | PluralForms): string[] {
  const texts = typeof value === 'string' ? [value] : Object.values(value);
  return [...new Set(texts.flatMap(text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]!)))].sort();
}

/** Parses an Accept-Language header into language tags ordered by quality. Malformed entries are ignored. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header || header.length > 512) return [];
  return header.split(',').map((part, index) => {
    const [tag = '', ...parameters] = part.trim().split(';');
    const quality = parameters.find(parameter => /^\s*q\s*=/i.test(parameter))?.split('=')[1]?.trim();
    // A missing q means 1; a malformed q makes the entry unusable rather than silently top priority.
    const q = quality === undefined ? 1 : /^(0(\.\d{0,3})?|1(\.0{0,3})?)$/.test(quality) ? Number(quality) : Number.NaN;
    return { tag: tag.trim().toLowerCase(), q, index };
  }).filter(entry => /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(entry.tag) && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index).map(entry => entry.tag);
}

/**
 * Picks the visitor's language: explicit cookie choice, then browser preference, then the installation default.
 * Only codes in `supported` can ever be returned.
 */
export function negotiateLocale<T extends string>(input: { cookie?: string | null; acceptLanguage?: string | null; supported: readonly T[]; fallback: T }): T {
  const supported = new Map(input.supported.map(code => [code.toLowerCase(), code] as const));
  const cookie = input.cookie?.toLowerCase();
  if (cookie && supported.has(cookie)) return supported.get(cookie)!;
  for (const tag of parseAcceptLanguage(input.acceptLanguage)) {
    const exact = supported.get(tag);
    if (exact) return exact;
    const primary = tag.split('-')[0]!;
    const match = supported.get(primary) ?? [...supported].find(([code]) => code.split('-')[0] === primary)?.[1];
    if (match) return match;
  }
  return input.fallback;
}

/** Resolves the BCP 47 tag used for numbers and dates. The installation `locale` refines its own language only. */
export function formatLocaleFor(locale: Locale, registryTag: string, config: { defaultLocale: string; locale: string }): string {
  return locale === config.defaultLocale && config.locale.toLowerCase().split('-')[0] === locale.split('-')[0] ? config.locale : registryTag;
}
