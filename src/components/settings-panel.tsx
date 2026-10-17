"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CheckCircle2, Command, Copy, LockKeyhole, Plug, Settings2, ShieldCheck, Store } from "lucide-react";
import { templateConfig } from "@/template.config";
import { errorMessage, usePos } from "./pos-provider";
import { ErrorAlert } from "./ui";
import { AdminRuntimeSettings } from "@/runtime/components";

const moduleLabels = { catalog: "Catálogo de productos", inventory: "Control de inventario", orders: "Ventas y comprobantes", mcp: "Asistente por MCP" };
const roleLabels = { owner: "Propietario", admin: "Administrador", cashier: "Cajero", viewer: "Solo lectura" };
export function SettingsPanel() {
  const { session, notify } = usePos();
  const [endpoint, setEndpoint] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setEndpoint(`${window.location.origin}/api/mcp`); }, []);
  async function copyEndpoint() {
    try { await navigator.clipboard.writeText(endpoint); setCopied(true); notify("URL del conector copiada."); }
    catch (failure) { setError(`No se pudo copiar. Seleccioná y copiá la URL manualmente. ${errorMessage(failure)}`); }
  }
  async function copySupportInfo() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ application: templateConfig.name, origin: window.location.origin, tenantId: session?.tenant.id, role: session?.role, demo: session?.demo, timestamp: new Date().toISOString() }, null, 2));
      notify("Contexto de soporte copiado, sin credenciales.");
    } catch { setError("No se pudo copiar el contexto de soporte desde este navegador."); }
  }
  return <><div className="page-heading"><div><div className="section-kicker"><span className="tiny-line" />A TU MANERA</div><h1>Tu espacio de trabajo<span className="heading-dot">.</span></h1><p>Tu empresa, tus permisos y las herramientas que te acompañan.</p></div></div><ErrorAlert message={error} /><div className="settings-grid"><section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><Store size={22} /></span><div><h2>Mi empresa</h2><p>El espacio activo para todas tus operaciones.</p></div></div><dl className="settings-details"><div><dt>Empresa</dt><dd>{session?.tenant.name || "Sin sesión activa"}</dd></div><div><dt>Usuario</dt><dd>{session?.user.name || "—"}</dd></div><div><dt>Permiso</dt><dd>{session ? roleLabels[session.role] : "—"}</dd></div><div><dt>Moneda predeterminada</dt><dd className="money">{templateConfig.currency}</dd></div><div><dt>Entorno</dt><dd><span className={`badge ${session?.demo ? "badge-demo" : "badge-green"}`}>{session?.demo ? "Demostración local" : "Operación conectada"}</span></dd></div></dl><p className="settings-note"><ShieldCheck size={16} />Tus productos y operaciones pertenecen a esta empresa. Cambiá de empresa desde el selector lateral.</p></section>
      {session?.role === 'owner' || session?.role === 'admin' ? <AdminRuntimeSettings key={session.tenant.id} /> : null}
      <section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><Settings2 size={22} /></span><div><h2>Herramientas habilitadas</h2><p>Las funciones disponibles en este negocio.</p></div></div><div className="module-list">{Object.entries(templateConfig.modules).map(([key, enabled]) => <div key={key}><span>{moduleLabels[key as keyof typeof moduleLabels]}</span><span className={enabled ? "module-enabled" : "module-disabled"}>{enabled ? <CheckCircle2 size={16} /> : null}{enabled ? "Disponible" : "Desactivado"}</span></div>)}</div><p className="settings-note">La persona que implementa tu tienda puede adaptar los módulos y la identidad del negocio.</p></section>
      {templateConfig.modules.mcp ? <section className="settings-card mcp-settings" id="mcp"><div className="mcp-intro"><span className="mcp-large-icon"><Command size={28} /></span><span className="section-kicker">UN ASISTENTE CON CONTEXTO</span><h2>Hablá con tu negocio.</h2><p>Consultá productos, revisá ventas y administrá existencias desde tu asistente, con los permisos de tu cuenta.</p><div className="assistant-brands"><span>Claude</span><span>ChatGPT</span><span className="muted">MCP</span></div></div><div className="mcp-connection"><h3>Conectar un asistente</h3><p className="muted">Agregá esta URL como conector MCP remoto en tu asistente compatible.</p><label className="field-label" htmlFor="mcp-endpoint">URL del conector</label><div className="copy-field"><input id="mcp-endpoint" className="input money" readOnly value={endpoint} onFocus={(event) => event.target.select()} /><button className="icon-button" aria-label="Copiar URL del conector" disabled={!endpoint} onClick={() => void copyEndpoint()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div><ol className="connection-steps"><li><span>1</span><div><strong>Agregá el conector</strong><p>En las opciones de conexiones de tu asistente, creá una conexión con esta URL.</p></div></li><li><span>2</span><div><strong>Autorizá tu cuenta</strong><p>Iniciá sesión y revisá los permisos antes de conceder acceso.</p></div></li><li><span>3</span><div><strong>Pedile algo concreto</strong><p>“Mostrame los productos que necesitan reposición”.</p></div></li></ol><div className="mcp-security"><LockKeyhole size={17} /><p>{session?.demo ? "La demo permite probar el negocio localmente. Para conectar un asistente remoto necesitás una instalación con HTTPS y autorización configurada." : "La conexión remota requiere HTTPS y autorización configurada. La disponibilidad de conectores depende del plan y las opciones del asistente."}</p></div></div></section> : null}
      {templateConfig.modules.mcp && !session?.demo ? <section className="settings-card support-settings"><div className="settings-card-heading"><span className="settings-icon"><ShieldCheck size={22} /></span><div><h2>Controlá los permisos de tus agentes</h2><p>Revisá conexiones autorizadas y revocá el acceso cuando lo necesites.</p></div></div><Link className="button button-secondary" href="/onboarding/connections">Administrar conexiones <ArrowUpRight size={15} /></Link></section> : null}
      <section className="settings-card support-settings"><div className="settings-card-heading"><span className="settings-icon"><Plug size={22} /></span><div><h2>¿Algo no salió como esperabas?</h2><p>Compartí el contexto con quien administra tu instalación para localizar el problema.</p></div></div><button className="button button-secondary" onClick={() => void copySupportInfo()}><Copy size={15} />Copiar contexto de soporte</button><p className="form-note">Incluye la empresa, tu rol y la hora. No incluye contraseñas, tokens ni datos de ventas.</p></section></div></>;
}
