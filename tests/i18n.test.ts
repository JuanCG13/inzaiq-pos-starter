import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createTranslator, flattenMessages, formatLocaleFor, mergeMessages, negotiateLocale, parseAcceptLanguage, placeholdersOf } from '../src/i18n/core';
import { validateLocalization } from '../src/i18n/config';
import { availableLocales, localeRegistry } from '../src/i18n/locales';
import { messageLoaders } from '../src/i18n/messages';
import en from '../src/i18n/messages/en';
import { currencyDigits, formatMoney, moneyInput, parseMoney } from '../src/i18n/format';
import { demoCatalog } from '../src/db/demo-catalog';
import { ApiError, describeError } from '../src/lib/api-client';
import { MCP_SCOPES } from '../src/lib/auth';
import { templateConfig } from '../src/template.config';
import type { MessageKey, Messages } from '../src/i18n/types';

const root = join(__dirname, '..');
const files = (directory: string): string[] => readdirSync(join(root, directory), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && /\.(ts|tsx)$/.test(entry.name)).map(entry => relative(root, join(entry.parentPath, entry.name)));
const dictionaries = async () => Object.fromEntries(await Promise.all(availableLocales.map(async code => [code, await messageLoaders[code]()] as const))) as Record<string, Messages>;
const t = createTranslator('en', 'en-US', en);
const plain = (text: string) => text.replace(/\u00a0/g, ' '); // Intl separates symbol and amount with a no-break space

describe('dictionaries', () => {
  it('registers a loader, a dictionary file and a format tag for every language', async () => {
    const onDisk = readdirSync(join(root, 'src/i18n/messages')).filter(name => /^[a-z]{2,3}(-[A-Za-z0-9]+)?\.ts$/.test(name)).map(name => name.replace(/\.ts$/, '')).sort();
    expect(onDisk).toEqual([...availableLocales].sort());
    for (const code of availableLocales) expect(() => new Intl.NumberFormat(localeRegistry[code].intl)).not.toThrow();
  });
  it('gives every language exactly the same keys and placeholders as English', async () => {
    const source = flattenMessages(en);
    for (const [code, messages] of Object.entries(await dictionaries())) {
      const translated = flattenMessages(messages);
      expect([...translated.keys()].sort(), `${code}: keys`).toEqual([...source.keys()].sort());
      for (const [key, value] of source) {
        expect(placeholdersOf(translated.get(key)!), `${code}: placeholders of ${key}`).toEqual(placeholdersOf(value));
        expect(typeof translated.get(key), `${code}: shape of ${key}`).toBe(typeof value);
        const text = typeof translated.get(key) === 'string' ? translated.get(key) as string : Object.values(translated.get(key) as object).join('');
        expect(text.trim().length, `${code}: ${key} is empty`).toBeGreaterThan(0);
        expect(text, `${code}: ${key} contains markup`).not.toMatch(/<[a-z/][^>]*>/i);
      }
    }
  });
  it('only uses plural tables with valid CLDR categories and an "other" fallback', async () => {
    for (const [code, messages] of Object.entries(await dictionaries())) {
      for (const [key, value] of flattenMessages(messages)) if (typeof value !== 'string') {
        expect(Object.keys(value).every(category => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(category)), `${code}: ${key}`).toBe(true);
        expect(value.other).toBeTruthy();
        expect(placeholdersOf(value), `${code}: ${key} must show the count`).toContain('count');
      }
    }
  });
  it('translates every MCP scope the consent screen can show', async () => {
    for (const code of availableLocales) {
      const translate = createTranslator(code, localeRegistry[code].intl, (await dictionaries())[code]!);
      for (const scope of ['openid', 'profile', 'offline_access', ...MCP_SCOPES]) expect(translate(`scopes.${scope}` as MessageKey), `${code}: ${scope}`).not.toBe(`scopes.${scope}`);
    }
  });
  it('translates every user-reachable server error code or lists it as intentionally untranslated', () => {
    const exempt = new Set(['DEMO_DISABLED', 'EXTENSION_INPUT_INVALID']); // protocol/setup errors never shown by the UI
    const codes = new Set<string>();
    for (const file of files('src')) for (const match of readFileSync(join(root, file), 'utf8').matchAll(/AppError\(\s*'([A-Z_]+)'/g)) codes.add(match[1]!);
    const missing = [...codes].filter(code => !exempt.has(code) && t(`errors.${code}` as MessageKey) === `errors.${code}`);
    expect(missing).toEqual([]);
  });
  it('keeps interface text out of the components so the language switch is complete', () => {
    const allowed = new Set(['src/components/ui.tsx']); // category keywords for icon selection, not display text
    const offenders = files('src').filter(file => !file.startsWith('src/i18n/') && !file.startsWith('src/db/demo-catalog') && !allowed.has(file))
      .filter(file => /[¿¡ñáéíóú]/.test(readFileSync(join(root, file), 'utf8').replace(/[×·—–…“”’→←↵]/g, '')));
    expect(offenders).toEqual([]);
  });
});

describe('translator', () => {
  it('interpolates placeholders and formats numbers for the active locale', () => {
    expect(t('pos.allUnitsAdded', { name: 'Tee' })).toBe("You've already added all available units of Tee.");
    expect(t('pos.available', { count: 1234 })).toBe('1,234 available');
    expect(createTranslator('es', 'es-419', en)('pos.available', { count: 1234 })).toBe('1,234 available');
    expect(createTranslator('es', 'es', en)('pos.available', { count: 1234 })).toBe('1234 available'); // es has min grouping 2
  });
  it('selects plural forms with the language rules and leaves unknown placeholders visible', async () => {
    expect(t('pos.units', { count: 1 })).toBe('1 unit');
    expect(t('pos.units', { count: 0 })).toBe('0 units');
    expect(t('pos.units', { count: 2 })).toBe('2 units');
    const es = createTranslator('es', 'es-419', (await dictionaries()).es!);
    expect(es('pos.units', { count: 1 })).toBe('1 unidad');
    expect(es('pos.units', { count: 5 })).toBe('5 unidades');
    expect(t('pos.allUnitsAdded')).toContain('{name}');
    expect(t('pos.units')).toBe('{count} units'); // no count → "other"
  });
  it('falls back to the default language and finally to the key instead of throwing', () => {
    const partial = { common: { close: 'Fermer' } } as unknown as Messages;
    const fr = createTranslator('fr', 'fr-FR', partial, en);
    expect(fr('common.close')).toBe('Fermer');
    expect(fr('common.cancel')).toBe('Cancel');
    expect(createTranslator('fr', 'fr-FR', partial)('common.cancel')).toBe('common.cancel');
    expect(t('does.not.exist' as MessageKey)).toBe('does.not.exist');
    expect(t('__proto__.constructor' as MessageKey)).toBe('__proto__.constructor');
  });
  it('merges a partial language over the base without mixing plural tables', () => {
    const merged = mergeMessages(en, { pos: { units: { other: '{count} Einheiten' } } } as unknown as Messages);
    expect(createTranslator('de', 'de-DE', merged)('pos.units', { count: 1 })).toBe('1 Einheiten');
    expect(merged.pos.cash).toBe('Cash');
  });
  it('escapes nothing itself: output is plain text that React escapes, never markup', () => {
    expect(t('pos.allUnitsAdded', { name: '<img src=x onerror=alert(1)>' })).toBe("You've already added all available units of <img src=x onerror=alert(1)>.");
  });
});

describe('language negotiation', () => {
  const supported = ['en', 'es'] as const;
  it('prefers the explicit cookie, then Accept-Language quality order, then the default', () => {
    expect(negotiateLocale({ cookie: 'es', acceptLanguage: 'en-US,en;q=0.9', supported, fallback: 'en' })).toBe('es');
    expect(negotiateLocale({ cookie: undefined, acceptLanguage: 'fr-CH, es-PY;q=0.8, en;q=0.5', supported, fallback: 'en' })).toBe('es');
    expect(negotiateLocale({ acceptLanguage: 'de-DE,de;q=0.9', supported, fallback: 'en' })).toBe('en');
    expect(negotiateLocale({ supported, fallback: 'es' })).toBe('es');
  });
  it('ignores unsupported, malformed or hostile input', () => {
    expect(negotiateLocale({ cookie: 'fr', acceptLanguage: 'es', supported, fallback: 'en' })).toBe('es');
    expect(negotiateLocale({ cookie: '../../etc/passwd', supported, fallback: 'en' })).toBe('en');
    expect(negotiateLocale({ cookie: '__proto__', supported, fallback: 'en' })).toBe('en');
    expect(parseAcceptLanguage('*, ;q=1, es;q=abc, en;q=0, es-PY;q=0.4, "><script>')).toEqual(['es-py']);
    expect(parseAcceptLanguage('x'.repeat(600))).toEqual([]);
    expect(negotiateLocale({ acceptLanguage: 'ES-py', supported, fallback: 'en' })).toBe('es');
  });
  it('matches regional codes by language and resolves the format tag', () => {
    expect(negotiateLocale({ acceptLanguage: 'pt-BR', supported: ['pt-PT', 'en'] as const, fallback: 'en' })).toBe('pt-PT');
    expect(formatLocaleFor('es', 'es-419', { defaultLocale: 'es', locale: 'es-PY' })).toBe('es-PY');
    expect(formatLocaleFor('en', 'en-US', { defaultLocale: 'es', locale: 'es-PY' })).toBe('en-US');
    expect(formatLocaleFor('es', 'es-419', { defaultLocale: 'en', locale: 'en-US' })).toBe('es-419');
  });
});

describe('currency', () => {
  it('defaults to USD with English and lets the installation override it', () => {
    expect(templateConfig.currency).toBe('USD');
    expect(templateConfig.i18n.defaultLocale).toBe('en');
    expect(templateConfig.currencies).toContain('USD');
    expect(validateLocalization(templateConfig)).toEqual([]);
  });
  it('formats integer minor units per currency digits and language', () => {
    expect(formatMoney('en-US', 2900, 'USD')).toBe('$29.00');
    expect(plain(formatMoney('es-419', 2900, 'USD'))).toBe('USD 29.00');
    expect(plain(formatMoney('es-PY', 65000, 'PYG'))).toBe('Gs. 65.000');
    expect(formatMoney('en-US', 1250, 'EUR')).toBe('€12.50');
    expect(currencyDigits('USD')).toBe(2); expect(currencyDigits('PYG')).toBe(0); expect(currencyDigits('JPY')).toBe(0); expect(currencyDigits('KWD')).toBe(3);
    expect(() => currencyDigits('us')).toThrow(RangeError);
  });
  it('round-trips and rejects ambiguous amounts', () => {
    expect(moneyInput(1250, 'USD')).toBe('12.50');
    expect(parseMoney('12,5', 'USD')).toBe(1250);
    expect(parseMoney('12.505', 'USD')).toBeNull();
    expect(parseMoney('1,250.00', 'USD')).toBeNull();
    expect(parseMoney('-1', 'USD')).toBeNull();
    expect(parseMoney('9007199254740993', 'USD')).toBeNull();
    expect(parseMoney('65000', 'PYG')).toBe(65000);
    expect(parseMoney('1.5', 'PYG')).toBeNull();
  });
  it('rejects invalid localization settings with actionable messages', () => {
    const base = { currency: 'USD', currencies: ['USD', 'EUR'], locale: 'en-US', i18n: { defaultLocale: 'en', locales: ['en', 'es'] } };
    expect(validateLocalization(base)).toEqual([]);
    expect(validateLocalization({ ...base, currency: 'usd' }).join()).toContain('three-letter');
    expect(validateLocalization({ ...base, currencies: ['EUR'] }).join()).toContain('include the default currency');
    expect(validateLocalization({ ...base, currencies: ['USD', 'ZZZ'] }).join()).toContain('not supported');
    expect(validateLocalization({ ...base, i18n: { defaultLocale: 'fr', locales: ['en', 'fr'] } }).join()).toContain('no dictionary is registered');
    expect(validateLocalization({ ...base, i18n: { defaultLocale: 'es', locales: ['en'] } }).join()).toContain('one of i18n.locales');
    expect(validateLocalization({ ...base, locale: 'es-PY' }).join()).toContain('language of i18n.defaultLocale');
    expect(validateLocalization({ ...base, locale: 'not a locale' }).join()).toContain('BCP 47');
  });
});

describe('demo catalog', () => {
  it('prices the sample catalog in the chosen currency using its own minor units', () => {
    const usd = demoCatalog('pos', 'en', 'USD');
    expect(usd.find(item => item.sku === 'DES-001')).toMatchObject({ name: 'Ground coffee 1 lb', priceMinor: 1250, currency: 'USD' });
    expect(usd.find(item => item.sku === 'LIM-001')?.priceMinor).toBe(399);
    expect(demoCatalog('pos', 'en', 'PYG').find(item => item.sku === 'DES-001')?.priceMinor).toBe(13);
    expect(new Set(usd.map(item => item.sku)).size).toBe(usd.length);
    expect(usd.every(item => !item.imageUrl)).toBe(true);
  });
  it('translates names and falls back to English for languages without a demo translation', () => {
    expect(demoCatalog('pos', 'es', 'USD').find(item => item.sku === 'ROP-001')?.name).toBe('Camiseta esencial');
    expect(demoCatalog('pos', 'es-PY', 'USD')[0]?.category).toBe('Despensa');
    expect(demoCatalog('pos', 'fr', 'USD')[0]?.name).toBe('Ground coffee 1 lb');
    expect(demoCatalog('ecommerce', 'en', 'EUR')).toHaveLength(6);
  });
});

describe('error presentation', () => {
  it('translates by server code, keeps unknown codes readable and appends the support reference', () => {
    expect(describeError(new ApiError('New transactions are paused. Try again later.', 409, 'req-1', 'ORDERS_PAUSED'), t)).toBe('New transactions are paused. Try again later. Reference: req-1');
    expect(describeError(new ApiError('Algo específico', 400, undefined, 'SOMETHING_NEW'), t)).toBe('Algo específico');
    expect(describeError(new ApiError('Could not connect.', 0, 'req-2', 'NETWORK_ERROR'), t)).toContain("We couldn't connect.");
    expect(describeError(new Error('Local failure'), t)).toBe('Local failure');
    expect(describeError('boom', t)).toBe("We couldn't complete the operation. Please try again.");
  });
  it('shows the same failure in each language', async () => {
    const es = createTranslator('es', 'es-419', (await dictionaries()).es!);
    expect(describeError(new ApiError('x', 409, undefined, 'ORDERS_PAUSED'), es)).toBe('Las nuevas operaciones están pausadas. Intentá más tarde.');
  });
});

describe('npm run configure', () => {
  const sandboxes: string[] = [];
  function sandbox() {
    const directory = mkdtempSync(join(tmpdir(), 'configure-'));
    sandboxes.push(directory);
    mkdirSync(join(directory, 'src/i18n/messages'), { recursive: true });
    cpSync(join(root, 'src/template.config.ts'), join(directory, 'src/template.config.ts'));
    cpSync(join(root, 'src/i18n/locales.ts'), join(directory, 'src/i18n/locales.ts'));
    for (const code of availableLocales) writeFileSync(join(directory, `src/i18n/messages/${code}.ts`), '');
    return directory;
  }
  const run = (directory: string, ...args: string[]) => {
    try { return { status: 0, output: execFileSync('node', [join(root, 'scripts/configure.mjs'), ...args], { cwd: directory, encoding: 'utf8', stdio: 'pipe' }) }; }
    catch (error) { const failure = error as { status: number; stderr: string }; return { status: failure.status, output: failure.stderr }; }
  };
  afterAll(() => { for (const directory of sandboxes) rmSync(directory, { recursive: true, force: true }); });

  it('changes currency, regional format and languages together and keeps the file loadable', () => {
    const directory = sandbox();
    const result = run(directory, '--name', 'Corner Store', '--currency', 'eur', '--locale', 'es-PY', '--currencies', 'USD,PYG');
    expect(result.status).toBe(0);
    const written = readFileSync(join(directory, 'src/template.config.ts'), 'utf8');
    expect(written).toContain('"currency": "EUR"');
    expect(written).toContain('"defaultLocale": "es"');
    expect(JSON.parse(written.match(/= (\{[\s\S]*\});/)![1]!).currencies).toEqual(['EUR', 'USD', 'PYG']);
    expect(written).toContain('export interface TemplateConfig');
  });
  it('refuses unknown languages, mismatched locales and invalid currencies without touching the file', () => {
    const directory = sandbox();
    const before = readFileSync(join(directory, 'src/template.config.ts'), 'utf8');
    expect(run(directory, '--locales', 'en,xx')).toMatchObject({ status: 1 });
    expect(run(directory, '--locales', 'en,xx').output).toContain('docs/i18n.md');
    expect(run(directory, '--locale', 'fr-FR').output).toContain('must use the default language');
    expect(run(directory, '--currency', 'ZZZ').output).toContain('not supported');
    expect(run(directory, '--default-locale', 'es', '--locales', 'en').output).toContain('must be one of');
    expect(readFileSync(join(directory, 'src/template.config.ts'), 'utf8')).toBe(before);
  });
});
