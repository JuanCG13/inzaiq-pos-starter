/** Locale-independent money rules plus cached Intl formatters. Amounts are always integer minor units. */
const currencyFormats = new Map<string, Intl.NumberFormat>();
function currencyFormat(intlLocale: string, currency: string) {
  const key = `${intlLocale}|${currency}`;
  let format = currencyFormats.get(key);
  if (!format) { format = new Intl.NumberFormat(intlLocale, { style: 'currency', currency }); currencyFormats.set(key, format); }
  return format;
}
const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** Number of minor-unit digits (2 for USD, 0 for PYG). Throws RangeError for an invalid currency code. */
export function currencyDigits(currency: string): number {
  return currencyFormat('en-US', currency).resolvedOptions().maximumFractionDigits ?? 2;
}
export function formatMoney(intlLocale: string, valueMinor: number, currency: string): string {
  return currencyFormat(intlLocale, currency).format(valueMinor / 10 ** currencyDigits(currency));
}
export function moneyInput(valueMinor: number, currency: string): string {
  return (valueMinor / 10 ** currencyDigits(currency)).toFixed(currencyDigits(currency));
}
/** Parses a plain decimal amount ("12.50" or "12,50") into minor units; returns null when invalid. */
export function parseMoney(value: string, currency: string): number | null {
  const digits = currencyDigits(currency);
  const normalized = value.trim().replace(',', '.');
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, digits)}})?$`).test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > digits) return null;
  const result = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
export function formatDate(intlLocale: string, value: string): string {
  let format = dateFormats.get(intlLocale);
  if (!format) { format = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeStyle: 'short' }); dateFormats.set(intlLocale, format); }
  return format.format(new Date(value));
}
