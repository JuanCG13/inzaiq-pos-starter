'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { templateConfig } from '@/template.config';
import { useI18n } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/language-switcher';
type Connection = { id: string; name: string; scopes: string[] };
export default function ConnectionsPage() {
  const { t } = useI18n();
  const translate = useRef(t); // effects read the latest translator without re-running on a language change
  translate.current = t;
  const [items, setItems] = useState<Connection[]>([]); const [tenantId, setTenantId] = useState('');
  const [origin, setOrigin] = useState(''); // read after hydration: the server cannot know the public origin
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => { void (async () => {
    try {
      const session = await authClient.getSession();
      const active = session.data?.session.activeOrganizationId;
      if (!active) { window.location.assign('/sign-in'); return; }
      setTenantId(active);
      const consents = await authClient.oauth2.getConsents();
      if (consents.error) throw new Error('load');
      const scoped = (consents.data ?? []).filter(consent => consent.referenceId === active).slice(0, 100);
      setItems(await Promise.all(scoped.map(async consent => {
        const client = await authClient.oauth2.publicClient({ query: { client_id: consent.clientId } });
        return { id: consent.id, name: client.data?.client_name || translate.current('auth.connections.fallbackName'), scopes: [...consent.scopes] };
      })));
    } catch { setError(translate.current('auth.connections.loadFailed')); } finally { setLoading(false); }
  })(); }, []);
  async function disconnect(id: string) {
    setBusy(id); setError('');
    try {
      const result = await authClient.oauth2.deleteConsent({ id });
      if (result.error) throw new Error('revoke');
      setItems(current => current.filter(item => item.id !== id));
    } catch { setError(t('auth.connections.disconnectFailed')); } finally { setBusy(''); }
  }
  return <main id="main-content" style={{ maxWidth: 760, margin: '60px auto', padding: 24 }}><div className="language-corner"><LanguageSwitcher /></div><Link href={templateConfig.kind === 'pos' ? '/' : '/admin'}>{t('auth.connections.back')}</Link><p style={{ marginTop: 40, color: '#6e6e73' }}>{t('auth.connections.kicker')}</p><h1 style={{ fontSize: 38 }}>{t('auth.connections.title')}</h1><p style={{ color: '#6e6e73', lineHeight: 1.6 }}>{t('auth.connections.subtitle')}</p>{loading && <p role="status">{t('auth.connections.loading')}</p>}{error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}<div style={{ display: 'grid', gap: 16, margin: '28px 0' }}>{items.map(item => <article key={item.id} style={{ border: '1px solid #e5e5e7', borderRadius: 20, padding: 24 }}><h2>{item.name}</h2><p style={{ color: '#6e6e73', overflowWrap: 'anywhere' }}>{item.scopes.join(' · ')}</p><button onClick={() => void disconnect(item.id)} disabled={!!busy} style={{ background: '#fff1f0', color: '#b42318', padding: '10px 18px', border: 0, borderRadius: 10 }}>{busy === item.id ? t('auth.connections.disconnecting') : t('auth.connections.disconnect')}</button></article>)}</div>{!loading && !items.length && !error && <p>{t('auth.connections.none')}</p>}
    <section style={{ marginTop: 40, padding: 24, background: '#f5f5f7', borderRadius: 20 }}><h2 style={{ fontSize: 20 }}>{t('auth.connections.detailsTitle')}</h2><p>{t('auth.connections.mcpUrl')} <code style={{ overflowWrap: 'anywhere' }}>{origin}/api/mcp</code></p><p>{t('auth.connections.businessId')} <code style={{ overflowWrap: 'anywhere' }}>{tenantId || '—'}</code></p><p style={{ color: '#6e6e73' }}>{t('auth.connections.implementerNote')}</p></section>
  </main>;
}
