import type { Locale } from "./i18n/locales";
/**
 * Installation settings. `npm run configure` rewrites the object below; edit it directly for anything else.
 * - currency: default ISO 4217 code for new products, the dashboard and the "Default currency" display.
 * - currencies: codes offered in the product form. Amounts are stored per product in integer minor units.
 * - locale: regional number/date format for the default language (for example en-US, es-PY).
 * - i18n: languages the interface offers. Add one by following docs/i18n.md.
 * - description: leave empty to use each language's translated tagline; set text to override it everywhere.
 */
export interface TemplateConfig { name:string; description:string; kind:"ecommerce"|"pos"; currency:string; currencies:string[]; locale:string; i18n:{defaultLocale:Locale; locales:Locale[]}; modules:{catalog:boolean; inventory:boolean; orders:boolean; mcp:boolean} }
export const templateConfig:TemplateConfig = {
  "name": "Nexo POS",
  "description": "",
  "kind": "pos",
  "currency": "USD",
  "currencies": [
    "USD",
    "EUR",
    "GBP",
    "MXN",
    "COP",
    "ARS",
    "BRL",
    "CLP",
    "PEN",
    "UYU",
    "PYG"
  ],
  "locale": "en-US",
  "i18n": {
    "defaultLocale": "en",
    "locales": [
      "en",
      "es"
    ]
  },
  "modules": {
    "catalog": true,
    "inventory": true,
    "orders": true,
    "mcp": true
  }
};
