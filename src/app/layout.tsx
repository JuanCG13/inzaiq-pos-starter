import type { Metadata } from "next";
import type { ReactNode } from "react";
import { templateConfig } from "@/template.config";
import { PosProvider } from "@/components/pos-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = { title: { default: templateConfig.name, template: `%s · ${templateConfig.name}` }, description: templateConfig.description, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es" data-scroll-behavior="smooth"><body><PosProvider><AppShell>{children}</AppShell></PosProvider></body></html>;
}
