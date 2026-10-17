import { parseArgs } from 'node:util';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const usage = `Usage: npm run configure -- [options]
  --name "My store"            Brand name
  --description "Tagline"      Overrides the translated tagline in every language ("" restores translations)
  --currency USD               Default ISO 4217 currency for new products and the dashboard
  --currencies USD,EUR,PYG     Currencies offered in the product form (the default is always included)
  --locale en-US               Regional number/date format for the default language
  --default-locale en          Default interface language (inferred from --locale when possible)
  --locales en,es              Languages the interface offers (each needs src/i18n/messages/<code>.ts)`;
const { values } = parseArgs({ options: {
  name: { type: 'string' }, description: { type: 'string' }, currency: { type: 'string' }, currencies: { type: 'string' },
  locale: { type: 'string' }, 'default-locale': { type: 'string' }, locales: { type: 'string' }, help: { type: 'boolean' },
} });
if (values.help) { console.info(usage); process.exit(0); }

const file = 'src/template.config.ts';
const old = readFileSync(file, 'utf8');
const match = old.match(/= (\{[\s\S]*\})\s*(?:as const)?;/);
if (!match) throw new Error('Configuration format changed. Edit src/template.config.ts directly.');
const config = JSON.parse(match[1]);
config.i18n ??= { defaultLocale: 'en', locales: ['en'] };
config.currencies ??= [config.currency];

const split = (text) => text.split(',').map((item) => item.trim()).filter(Boolean);
const registry = readFileSync('src/i18n/locales.ts', 'utf8');
const available = readdirSync('src/i18n/messages').map((name) => name.match(/^([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\.ts$/)?.[1]).filter(Boolean);
const language = (tag) => tag.toLowerCase().split('-')[0];

if (values.name) config.name = values.name;
if (values.description !== undefined) config.description = values.description;
if (values.currency) config.currency = values.currency.toUpperCase();
if (values.currencies) config.currencies = split(values.currencies.toUpperCase());
if (values.locale) config.locale = values.locale;
if (values.locales) config.i18n.locales = split(values.locales);
if (values['default-locale']) config.i18n.defaultLocale = values['default-locale'];
if (values.locale && !values['default-locale'] && config.i18n.locales.includes(language(values.locale))) config.i18n.defaultLocale = language(values.locale);

const problems = [];
if (!/^[A-Z]{3}$/.test(config.currency)) problems.push('Currency must be a 3-letter uppercase ISO 4217 code.');
const supported = typeof Intl.supportedValuesOf === 'function' ? new Set(Intl.supportedValuesOf('currency')) : null;
if (!config.currencies.includes(config.currency)) config.currencies.unshift(config.currency);
config.currencies = [...new Set(config.currencies)];
for (const code of config.currencies) {
  if (!/^[A-Z]{3}$/.test(code)) problems.push(`Currency "${code}" must be a 3-letter uppercase ISO 4217 code.`);
  else if (supported && !supported.has(code)) problems.push(`Currency "${code}" is not supported by this Node.js Intl data.`);
}
try { new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }); } catch { problems.push(`Locale "${config.locale}" or currency "${config.currency}" is invalid.`); }
if (!config.i18n.locales.length) problems.push('At least one language is required.');
for (const code of config.i18n.locales) {
  if (!available.includes(code) || !new RegExp(`\\b${code}\\s*:`).test(registry) || !existsSync(`src/i18n/messages/${code}.ts`)) problems.push(`Language "${code}" is not available. Available: ${available.join(', ')}. See docs/i18n.md to add one.`);
}
if (!config.i18n.locales.includes(config.i18n.defaultLocale)) problems.push(`Default language "${config.i18n.defaultLocale}" must be one of: ${config.i18n.locales.join(', ')}.`);
else if (language(config.locale) !== language(config.i18n.defaultLocale)) problems.push(`Locale "${config.locale}" must use the default language "${config.i18n.defaultLocale}" (for example ${config.i18n.defaultLocale}-XX).`);
if (problems.length) { console.error(problems.map((problem) => `- ${problem}`).join('\n')); console.error(`\n${usage}`); process.exit(1); }

writeFileSync(file, old.slice(0, match.index) + '= ' + JSON.stringify(config, null, 2) + ';\n');
console.info(`Configuration updated: ${config.name} · ${config.currency} · ${config.locale} · languages ${config.i18n.locales.join(', ')} (default ${config.i18n.defaultLocale}).`);
console.info('Existing product prices and currencies were NOT converted.');
