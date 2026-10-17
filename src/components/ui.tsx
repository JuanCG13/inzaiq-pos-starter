"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, Check, Coffee, LoaderCircle, Package, ShoppingBag, Shirt, Wine, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Product } from "@/core/contracts";
import { templateConfig } from "@/template.config";

export function currencyDigits(currency: string = templateConfig.currency): number {
  return new Intl.NumberFormat(templateConfig.locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}
export function money(value: number, currency: string = templateConfig.currency) {
  return new Intl.NumberFormat(templateConfig.locale, { style: "currency", currency }).format(value / 10 ** currencyDigits(currency));
}
export function moneyInput(value: number, currency: string = templateConfig.currency) { return (value / 10 ** currencyDigits(currency)).toFixed(currencyDigits(currency)); }
export function parseMoney(value: string, currency: string = templateConfig.currency): number | null {
  const digits = currencyDigits(currency);
  const normalized = value.trim().replace(",", ".");
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, digits)}})?$`).test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > digits) return null;
  const result = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, "0"));
  return Number.isSafeInteger(result) ? result : null;
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat(templateConfig.locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
export function Dialog({ open, onOpenChange, title, description, children, wide = false }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; wide?: boolean }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={`dialog-content${wide ? " dialog-wide" : ""}`}>
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="dialog-description">{description}</DialogPrimitive.Description>
        <DialogPrimitive.Close className="icon-button dialog-close" aria-label="Cerrar"><X size={19} /></DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
export function ErrorAlert({ message }: { message: string | null }) {
  return message ? <div className="alert alert-error" role="alert"><AlertCircle size={17} /><span>{message}</span></div> : null;
}
export function Spinner({ label = "Cargando" }: { label?: string }) { return <span className="inline-loading"><LoaderCircle className="spin" size={17} />{label}</span>; }
export function ProductArt({ product, small = false }: { product: Product; small?: boolean }) {
  const category = product.category.toLowerCase();
  const Icon = /ropa|textil|moda|remera|shirt/.test(category) ? Shirt : /bebida|drink/.test(category) ? Wine : /café|cafe|hogar|cocina/.test(category) ? Coffee : /accesori|bolso|bag/.test(category) ? ShoppingBag : Package;
  const hue = [...(product.category || product.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  return <div className={`product-art tone-${hue}${small ? " art-small" : ""}`}>
    {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
    <Icon aria-hidden="true" className="product-art-icon" size={small ? 24 : 60} strokeWidth={1.1} />
  </div>;
}
export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export function StatusBadge({ active, children }: { active: boolean; children: ReactNode }) { return <span className={`badge ${active ? "badge-green" : "badge-neutral"}`}>{active ? <Check size={12} /> : null}{children}</span>; }
