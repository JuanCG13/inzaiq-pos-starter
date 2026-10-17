"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CheckCircle2, Command, Copy, LockKeyhole, Plug, Settings2, ShieldCheck, Store } from "lucide-react";
import { templateConfig } from "@/template.config";
import { describeError } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import type { MessageKey } from "@/i18n/types";
import { usePos } from "./pos-provider";
import { ErrorAlert } from "./ui";
import { AdminRuntimeSettings } from "@/runtime/components";

const moduleLabels: Record<keyof typeof templateConfig.modules, MessageKey> = { catalog: "settings.moduleCatalog", inventory: "settings.moduleInventory", orders: "settings.moduleOrders", mcp: "settings.moduleMcp" };
export function SettingsPanel() {
  const { t } = useI18n();
  const { session, notify } = usePos();
  const [endpoint, setEndpoint] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setEndpoint(`${window.location.origin}/api/mcp`); }, []);
  async function copyEndpoint() {
    try { await navigator.clipboard.writeText(endpoint); setCopied(true); notify(t("settings.endpointCopied")); }
    catch (failure) { setError(t("settings.copyFailed", { message: describeError(failure, t) })); }
  }
  async function copySupportInfo() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ application: templateConfig.name, origin: window.location.origin, tenantId: session?.tenant.id, role: session?.role, demo: session?.demo, timestamp: new Date().toISOString() }, null, 2));
      notify(t("settings.supportCopied"));
    } catch { setError(t("settings.supportCopyFailed")); }
  }
  return <><div className="page-heading"><div><div className="section-kicker"><span className="tiny-line" />{t("settings.kicker")}</div><h1>{t("settings.title")}<span className="heading-dot">.</span></h1><p>{t("settings.subtitle")}</p></div></div><ErrorAlert message={error} /><div className="settings-grid"><section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><Store size={22} /></span><div><h2>{t("settings.businessTitle")}</h2><p>{t("settings.businessHint")}</p></div></div><dl className="settings-details"><div><dt>{t("settings.business")}</dt><dd>{session?.tenant.name || t("settings.noSession")}</dd></div><div><dt>{t("settings.user")}</dt><dd>{session?.user.name || "—"}</dd></div><div><dt>{t("settings.role")}</dt><dd>{session ? t(`roles.${session.role}`) : "—"}</dd></div><div><dt>{t("settings.defaultCurrency")}</dt><dd className="money">{templateConfig.currency}</dd></div><div><dt>{t("settings.environment")}</dt><dd><span className={`badge ${session?.demo ? "badge-demo" : "badge-green"}`}>{session?.demo ? t("settings.envDemo") : t("settings.envLive")}</span></dd></div></dl><p className="settings-note"><ShieldCheck size={16} />{t("settings.businessNote")}</p></section>
      {session?.role === 'owner' || session?.role === 'admin' ? <AdminRuntimeSettings key={session.tenant.id} /> : null}
      <section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><Settings2 size={22} /></span><div><h2>{t("settings.toolsTitle")}</h2><p>{t("settings.toolsHint")}</p></div></div><div className="module-list">{Object.entries(templateConfig.modules).map(([key, enabled]) => <div key={key}><span>{t(moduleLabels[key as keyof typeof moduleLabels])}</span><span className={enabled ? "module-enabled" : "module-disabled"}>{enabled ? <CheckCircle2 size={16} /> : null}{enabled ? t("settings.available") : t("settings.disabled")}</span></div>)}</div><p className="settings-note">{t("settings.toolsNote")}</p></section>
      {templateConfig.modules.mcp ? <section className="settings-card mcp-settings" id="mcp"><div className="mcp-intro"><span className="mcp-large-icon"><Command size={28} /></span><span className="section-kicker">{t("settings.mcpKicker")}</span><h2>{t("settings.mcpTitle")}</h2><p>{t("settings.mcpBody")}</p><div className="assistant-brands"><span>Claude</span><span>ChatGPT</span><span className="muted">MCP</span></div></div><div className="mcp-connection"><h3>{t("settings.connectTitle")}</h3><p className="muted">{t("settings.connectBody")}</p><label className="field-label" htmlFor="mcp-endpoint">{t("settings.connectorUrl")}</label><div className="copy-field"><input id="mcp-endpoint" className="input money" readOnly value={endpoint} onFocus={(event) => event.target.select()} /><button className="icon-button" aria-label={t("settings.copyUrl")} disabled={!endpoint} onClick={() => void copyEndpoint()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div><ol className="connection-steps"><li><span>1</span><div><strong>{t("settings.step1Title")}</strong><p>{t("settings.step1Body")}</p></div></li><li><span>2</span><div><strong>{t("settings.step2Title")}</strong><p>{t("settings.step2Body")}</p></div></li><li><span>3</span><div><strong>{t("settings.step3Title")}</strong><p>{t("settings.step3Body")}</p></div></li></ol><div className="mcp-security"><LockKeyhole size={17} /><p>{session?.demo ? t("settings.securityDemo") : t("settings.securityLive")}</p></div></div></section> : null}
      {templateConfig.modules.mcp && !session?.demo ? <section className="settings-card support-settings"><div className="settings-card-heading"><span className="settings-icon"><ShieldCheck size={22} /></span><div><h2>{t("settings.agentsTitle")}</h2><p>{t("settings.agentsBody")}</p></div></div><Link className="button button-secondary" href="/onboarding/connections">{t("settings.manageConnections")} <ArrowUpRight size={15} /></Link></section> : null}
      <section className="settings-card support-settings"><div className="settings-card-heading"><span className="settings-icon"><Plug size={22} /></span><div><h2>{t("settings.supportTitle")}</h2><p>{t("settings.supportBody")}</p></div></div><button className="button button-secondary" onClick={() => void copySupportInfo()}><Copy size={15} />{t("settings.copySupport")}</button><p className="form-note">{t("settings.supportNote")}</p></section></div></>;
}
