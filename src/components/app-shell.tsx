"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Boxes, Building2, ChevronDown, CircleHelp, Command, ExternalLink, History, LayoutGrid, LogOut, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import { templateConfig } from "@/template.config";
import { errorMessage, usePos } from "./pos-provider";
import { Dialog, ErrorAlert, Spinner } from "./ui";
import { RuntimeNotice } from "@/runtime/components";

interface Organization { id: string; name: string }
const links = [
  { href: "/", label: "Punto de venta", icon: LayoutGrid },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/orders", label: "Ventas", icon: History },
  { href: "/settings", label: "Configuración", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, loading, error, refresh, refreshing, notice } = usePos();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [switching, setSwitching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!session || session.demo) return;
    const controller = new AbortController();
    void fetch("/api/auth/organization/list", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("No se pudieron cargar tus empresas.");
      const result = await response.json() as Organization[];
      if (Array.isArray(result)) setOrganizations(result);
    }).catch((failure: unknown) => { if (!controller.signal.aborted) setActionError(errorMessage(failure)); });
    return () => controller.abort();
  }, [session]);

  async function changeOrganization(id: string) {
    if (id === session?.tenant.id) return;
    setSwitching(true); setActionError(null);
    try {
      const response = await fetch("/api/auth/organization/set-active", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: id }) });
      if (!response.ok) throw new Error("No se pudo cambiar de empresa. Tu empresa actual sigue activa.");
      window.location.assign("/");
    } catch (failure) { setActionError(errorMessage(failure)); setSwitching(false); }
  }
  async function signOut() {
    setSwitching(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("No se pudo cerrar la sesión.");
      window.location.assign("/sign-in");
    } catch (failure) { setActionError(errorMessage(failure)); setSwitching(false); }
  }

  if (["/sign-in", "/onboarding", "/consent"].some((prefix) => pathname.startsWith(prefix))) return <>{children}</>;
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="sidebar no-print">
      <Link className="brand" href="/" aria-label={`${templateConfig.name}, inicio`}><span className="brand-mark"><Command size={23} strokeWidth={2.5} /></span><span>{templateConfig.name}<small>OPERÁ CON CLARIDAD</small></span></Link>
      <div className="organization-card"><span className="organization-avatar">{session?.tenant.name.slice(0, 1).toUpperCase() || "N"}</span><div><span className="eyebrow">ESPACIO DE TRABAJO</span>{organizations.length > 1 ? <div className="organization-select"><select aria-label="Empresa activa" value={session?.tenant.id || ""} disabled={switching} onChange={(event) => void changeOrganization(event.target.value)}>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select><ChevronDown size={14} /></div> : <strong>{session?.tenant.name || "Tu negocio"}</strong>}</div></div>
      <span className="nav-label">TU NEGOCIO</span>
      <nav aria-label="Navegación principal">{links.filter((link) => link.href !== "/inventory" || templateConfig.modules.inventory).filter((link) => link.href !== "/orders" || templateConfig.modules.orders).map(({ href, label, icon: Icon }) => <Link key={href} className={`nav-link ${pathname === href ? "active" : ""}`} href={href} aria-label={label} aria-current={pathname === href ? "page" : undefined}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{pathname === href ? <span className="nav-active-dot" /> : null}</Link>)}</nav>
      <div className="sidebar-bottom">
        {templateConfig.modules.mcp ? <Link href="/settings#mcp" className="assistant-card"><span className="assistant-icon"><Command size={19} /></span><strong>Tu negocio. Tu agente.<ArrowUpRight size={16} /></strong><p>Administrá con Claude o ChatGPT.</p><span>Conectar asistente <ArrowUpRight size={13} /></span></Link> : null}
        <button className="nav-link help-button" onClick={() => setHelpOpen(true)}><CircleHelp size={19} /><span>Ayuda rápida</span><ExternalLink size={14} /></button>
        <div className="profile"><span className="profile-avatar">{session?.user.name?.slice(0, 1).toUpperCase() || "N"}</span><div><strong>{session?.user.name || "Mi cuenta"}</strong><small>{session?.demo ? "Sesión de demostración" : session?.role === "owner" ? "Propietario" : session?.role === "admin" ? "Administrador" : session?.role === "cashier" ? "Cajero" : "Solo lectura"}</small></div>{session && !session.demo ? <button className="icon-button" aria-label="Cerrar sesión" disabled={switching} onClick={() => void signOut()}><LogOut size={17} /></button> : null}</div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar no-print"><div className="breadcrumb">Mi negocio <span>/</span> <strong>{links.find((link) => link.href === pathname)?.label || "Administración"}</strong></div><div className="topbar-actions">{session && !session.demo ? <Link href="/onboarding" className="icon-button" title="Cambiar empresa" aria-label="Cambiar empresa"><Building2 size={16} /></Link> : null}{session?.demo ? <span className="badge badge-demo">DEMO · datos de ejemplo</span> : <span className={`connection-status ${error ? "disconnected" : ""}`}><span />{error ? "Revisá la conexión" : loading ? "Conectando" : "Conectado"}</span>}<button className="icon-button" title="Actualizar datos" aria-label="Actualizar datos" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={16} className={refreshing ? "spin" : ""} /></button></div></header>
      <main id="main-content" className="main-content">
        {session ? <RuntimeNotice key={session.tenant.id} endpoint="/api/runtime/settings" /> : null}
        <ErrorAlert message={actionError} />
        {error ? <div className="connection-error"><ErrorAlert message={error} /><div><button className="button button-secondary" onClick={() => void refresh()} disabled={refreshing}>Reintentar</button><Link className="button button-ghost" href="/sign-in">Iniciar sesión</Link></div><p>Los datos pueden estar desactualizados. Se requiere conexión para guardar cambios.</p></div> : null}
        {loading ? <div className="workspace-loading"><Spinner label="Preparando tu espacio de trabajo…" /><div className="skeleton-grid">{[1, 2, 3, 4, 5, 6].map((item) => <div className="skeleton" key={item} />)}</div></div> : children}
      </main>
    </div>
    {notice ? <div className="toast no-print" role="status"><ShieldCheck size={18} />{notice}</div> : null}
    <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="Un espacio para trabajar mejor" description="Atajos y funciones que simplifican tu día."><div className="help-list"><div><strong>Vender</strong><p>Buscá por nombre o SKU. Un lector de códigos configurado como teclado puede escribir el SKU y pulsar Enter.</p></div><div><strong>Controlar existencias</strong><p>En Inventario, registrá una entrada o salida e indicá el motivo. Cada ajuste queda vinculado a tu empresa.</p></div><div><strong>Cobrar en efectivo</strong><p>Armá el carrito, ingresá el monto recibido y confirmá. El stock se descuenta al registrar la venta.</p></div><div><strong>Tu asistente</strong><p>Configuración contiene la URL MCP y la guía de conexión para administrar el negocio con permisos.</p></div></div><button className="button button-primary full-width" onClick={() => setHelpOpen(false)}>Entendido</button></Dialog>
  </div>;
}
