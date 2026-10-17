'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/language-switcher';
import type { MessageKey } from '@/i18n/types';
export function ConsentForm({ clientName, organizationName, scopes }: { clientName: string; organizationName: string; scopes: string[] }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(scopes.filter(scope => !scope.endsWith(':write')));
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(accept: boolean) {
    setBusy(true); setError('');
    try {
      const result = await authClient.oauth2.consent({ accept, scope: selected.join(' ') });
      if (result.error || !result.data?.url) throw new Error('consent');
      window.location.assign(result.data.url);
    } catch { setError(t('auth.consent.failed')); } finally { setBusy(false); }
  }
  // Scopes are protocol identifiers: an unknown one is shown verbatim rather than hidden from the owner.
  const scopeLabel = (scope: string) => { const key = `scopes.${scope}` as MessageKey; const label = t(key); return label === key ? scope : label; };
  return <main id="main-content" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f5f7' }}><div className="language-corner"><LanguageSwitcher /></div><section style={{ width: '100%', maxWidth: 540, borderRadius: 28, background: 'white', padding: 36 }}><p style={{ color: '#6e6e73' }}>{t('auth.consent.kicker')}</p><h1 style={{ fontSize: 30 }}>{t('auth.consent.title', { client: clientName, organization: organizationName })}</h1><p style={{ lineHeight: 1.6, color: '#6e6e73' }}>{t('auth.consent.subtitle')}</p><div style={{ display: 'grid', gap: 16, margin: '28px 0' }}>{scopes.map(scope => <label key={scope} style={{ display: 'flex', gap: 12, alignItems: 'start' }}><input type="checkbox" checked={selected.includes(scope)} onChange={event => setSelected(current => event.target.checked ? [...current, scope] : current.filter(value => value !== scope))} /><span>{scopeLabel(scope)}</span></label>)}</div>{error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}<div style={{ display: 'flex', gap: 12 }}><button disabled={busy} onClick={() => void submit(false)} style={{ flex: 1, border: 0, padding: 14, borderRadius: 12 }}>{t('auth.consent.cancel')}</button><button disabled={busy || !selected.length} onClick={() => void submit(true)} style={{ flex: 1, background: '#0071e3', color: 'white', border: 0, padding: 14, borderRadius: 12 }}>{busy ? t('auth.consent.busy') : t('auth.consent.allow')}</button></div></section></main>;
}
