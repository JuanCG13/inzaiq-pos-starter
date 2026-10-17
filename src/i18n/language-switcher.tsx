'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { i18nSettings, localeLabel } from './config';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from './locales';
import { useI18n } from './provider';

/** Stores the explicit choice in a plain, non-secret cookie and re-renders the server layout in the new language. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { locales } = i18nSettings();
  if (locales.length < 2) return null;
  function change(next: string) {
    if (!isLocale(next) || next === locale) return;
    try { window.dispatchEvent(new CustomEvent('app:telemetry', { detail: { 'event.name': 'ui.language.changed', 'event.schema_version': 1, 'event.outcome': 'success', 'feature.name': 'language', 'feature.stage': 'changed' } })); } catch { /* Diagnostics never block the change. */ }
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    startTransition(() => router.refresh());
  }
  return <label className={`language-switcher ${className}`.trim()}>
    <Languages size={15} aria-hidden="true" />
    <span className="sr-only">{t('language.label')}</span>
    <select value={locale} disabled={pending} onChange={event => change(event.target.value)} data-testid="language-switcher">
      {locales.map(code => <option key={code} value={code} lang={code}>{localeLabel(code)}</option>)}
    </select>
  </label>;
}
