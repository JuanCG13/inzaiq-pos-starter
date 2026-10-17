"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Boxes, Building2, ChevronDown, CircleHelp, Command, ExternalLink, History, LayoutGrid, LogOut, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import { templateConfig } from "@/template.config";
import { describeError } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import type { MessageKey } from "@/i18n/types";
import { usePos } from "./pos-provider";
import { Dialog, ErrorAlert, Spinner } from "./ui";
import { RuntimeNotice } from "@/runtime/components";

interface Organization { id: string; name: string }
const links: { href: string; label: MessageKey; icon: typeof LayoutGrid }[] = [
  { href: "/", label: "nav.pos", icon: LayoutGrid },
  { href: "/inventory", label: "nav.inventory", icon: Boxes },
  { href: "/orders", label: "nav.sales", icon: History },
  { href: "/settings", label: "nav.settings", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  // Async callbacks read the latest translator without re-running their effects when the language changes.
  const translate = useRef(t);
  translate.current = t;
  const { session, loading, error, refresh, refreshing, notice } = usePos();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [switching, setSwitching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!session || session.demo) return;
    const controller = new AbortController();
    void fetch("/api/auth/organization/list", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error(translate.current("shell.couldNotLoadBusinesses"));
      const result = await response.json() as Organization[];
      if (Array.isArray(result)) setOrganizations(result);
    }).catch((failure: unknown) => { if (!controller.signal.aborted) setActionError(describeError(failure, translate.current)); });
    return () => controller.abort();
  }, [session]);

  async function changeOrganization(id: string) {
    if (id === session?.tenant.id) return;
    setSwitching(true); setActionError(null);
    try {
      const response = await fetch("/api/auth/organization/set-active", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: id }) });
      if (!response.ok) throw new Error(t("shell.couldNotSwitch"));
      window.location.assign("/");
    } catch (failure) { setActionError(describeError(failure, t)); setSwitching(false); }
  }
  async function signOut() {
    setSwitching(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error(t("shell.couldNotSignOut"));
      window.location.assign("/sign-in");
    } catch (failure) { setActionError(describeError(failure, t)); setSwitching(false); }
  }

  if (["/sign-in", "/onboarding", "/consent"].some((prefix) => pathname.startsWith(prefix))) return <>{children}</>;
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">{t("shell.skipToContent")}</a>
    <aside className="sidebar no-print">
      <Link className="brand" href="/" aria-label={t("brand.homeLabel", { name: templateConfig.name })}><span className="brand-mark"><Command size={23} strokeWidth={2.5} /></span><span>{templateConfig.name}<small>{t("brand.tagline")}</small></span></Link>
      <div className="organization-card"><span className="organization-avatar">{session?.tenant.name.slice(0, 1).toUpperCase() || "N"}</span><div><span className="eyebrow">{t("shell.workspace")}</span>{organizations.length > 1 ? <div className="organization-select"><select aria-label={t("shell.activeBusiness")} value={session?.tenant.id || ""} disabled={switching} onChange={(event) => void changeOrganization(event.target.value)}>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select><ChevronDown size={14} /></div> : <strong>{session?.tenant.name || t("shell.yourBusiness")}</strong>}</div></div>
      <span className="nav-label">{t("shell.navSection")}</span>
      <nav aria-label={t("shell.mainNavigation")}>{links.filter((link) => link.href !== "/inventory" || templateConfig.modules.inventory).filter((link) => link.href !== "/orders" || templateConfig.modules.orders).map(({ href, label, icon: Icon }) => <Link key={href} className={`nav-link ${pathname === href ? "active" : ""}`} href={href} aria-label={t(label)} aria-current={pathname === href ? "page" : undefined}><Icon size={19} strokeWidth={1.7} /><span>{t(label)}</span>{pathname === href ? <span className="nav-active-dot" /> : null}</Link>)}</nav>
      <div className="sidebar-bottom">
        {templateConfig.modules.mcp ? <Link href="/settings#mcp" className="assistant-card"><span className="assistant-icon"><Command size={19} /></span><strong>{t("shell.assistantTitle")}<ArrowUpRight size={16} /></strong><p>{t("shell.assistantSubtitle")}</p><span>{t("shell.assistantCta")} <ArrowUpRight size={13} /></span></Link> : null}
        <button className="nav-link help-button" onClick={() => setHelpOpen(true)}><CircleHelp size={19} /><span>{t("shell.quickHelp")}</span><ExternalLink size={14} /></button>
        <div className="profile"><span className="profile-avatar">{session?.user.name?.slice(0, 1).toUpperCase() || "N"}</span><div><strong>{session?.user.name || t("shell.account")}</strong><small>{session?.demo ? t("shell.demoSession") : session ? t(`roles.${session.role}`) : ""}</small></div>{session && !session.demo ? <button className="icon-button" aria-label={t("shell.signOut")} disabled={switching} onClick={() => void signOut()}><LogOut size={17} /></button> : null}</div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar no-print"><div className="breadcrumb">{t("shell.breadcrumbRoot")} <span>/</span> <strong>{(() => { const current = links.find((link) => link.href === pathname); return current ? t(current.label) : t("shell.breadcrumbFallback"); })()}</strong></div><div className="topbar-actions">{session && !session.demo ? <Link href="/onboarding" className="icon-button" title={t("shell.switchBusiness")} aria-label={t("shell.switchBusiness")}><Building2 size={16} /></Link> : null}{session?.demo ? <span className="badge badge-demo">{t("shell.demoBadge")}</span> : <span className={`connection-status ${error ? "disconnected" : ""}`}><span />{error ? t("shell.checkConnection") : loading ? t("shell.connecting") : t("shell.connected")}</span>}<LanguageSwitcher /><button className="icon-button" title={t("shell.refresh")} aria-label={t("shell.refresh")} disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={16} className={refreshing ? "spin" : ""} /></button></div></header>
      <main id="main-content" className="main-content">
        {session ? <RuntimeNotice key={session.tenant.id} endpoint="/api/runtime/settings" /> : null}
        <ErrorAlert message={actionError} />
        {error ? <div className="connection-error"><ErrorAlert message={error} /><div><button className="button button-secondary" onClick={() => void refresh()} disabled={refreshing}>{t("common.retry")}</button><Link className="button button-ghost" href="/sign-in">{t("shell.signIn")}</Link></div><p>{t("shell.staleData")}</p></div> : null}
        {loading ? <div className="workspace-loading"><Spinner label={t("shell.preparing")} /><div className="skeleton-grid">{[1, 2, 3, 4, 5, 6].map((item) => <div className="skeleton" key={item} />)}</div></div> : children}
      </main>
    </div>
    {notice ? <div className="toast no-print" role="status"><ShieldCheck size={18} />{notice}</div> : null}
    <Dialog open={helpOpen} onOpenChange={setHelpOpen} title={t("help.title")} description={t("help.description")}><div className="help-list"><div><strong>{t("help.sellTitle")}</strong><p>{t("help.sellBody")}</p></div><div><strong>{t("help.stockTitle")}</strong><p>{t("help.stockBody")}</p></div><div><strong>{t("help.cashTitle")}</strong><p>{t("help.cashBody")}</p></div><div><strong>{t("help.assistantTitle")}</strong><p>{t("help.assistantBody")}</p></div></div><button className="button button-primary full-width" onClick={() => setHelpOpen(false)}>{t("help.dismiss")}</button></Dialog>
  </div>;
}
